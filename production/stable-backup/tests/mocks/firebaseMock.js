/**
 * Firebase Mock for Testing
 * Provides mock implementations of Firebase Auth and Firestore
 */

class MockFirebaseAuth {
  constructor() {
    this.currentUser = null;
    this.callbacks = [];
    this.persistence = null;
  }

  onAuthStateChanged(callback) {
    this.callbacks.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  setPersistence(persistence) {
    this.persistence = persistence;
    return Promise.resolve();
  }

  createUserWithEmailAndPassword(email, password) {
    return Promise.resolve({
      user: {
        uid: 'newuser123',
        email: email,
        displayName: null,
        updateProfile: jest.fn(() => Promise.resolve())
      }
    });
  }

  signInWithEmailAndPassword(email, password) {
    if (email === 'test@example.com' && password === 'password123') {
      this.currentUser = {
        uid: 'user123',
        email: email,
        displayName: 'Test User'
      };
      this.callbacks.forEach(cb => cb(this.currentUser));
      return Promise.resolve({ user: this.currentUser });
    }
    return Promise.reject({
      code: 'auth/wrong-password',
      message: 'Incorrect password'
    });
  }

  signInWithPopup(provider) {
    this.currentUser = {
      uid: 'googleuser123',
      email: 'google@example.com',
      displayName: 'Google User',
      photoURL: 'https://example.com/photo.jpg'
    };
    this.callbacks.forEach(cb => cb(this.currentUser));
    return Promise.resolve({
      user: this.currentUser,
      additionalUserInfo: { isNewUser: false }
    });
  }

  signOut() {
    this.currentUser = null;
    this.callbacks.forEach(cb => cb(null));
    return Promise.resolve();
  }

  sendPasswordResetEmail(email) {
    return Promise.resolve();
  }
}

class MockFirestoreCollection {
  constructor(name, data = []) {
    this.name = name;
    this.data = data;
    this.snapshots = [];
  }

  doc(id) {
    return new MockFirestoreDocument(id, this);
  }

  where(field, op, value) {
    let filtered = this.data;
    if (op === '==') {
      filtered = this.data.filter(item => item[field] === value);
    } else if (op === '>=') {
      filtered = this.data.filter(item => item[field] >= value);
    } else if (op === '<=') {
      filtered = this.data.filter(item => item[field] <= value);
    }
    return new MockFirestoreQuery(filtered);
  }

  orderBy(field, direction = 'asc') {
    const sorted = [...this.data].sort((a, b) => {
      if (direction === 'desc') {
        return new Date(b[field]) - new Date(a[field]);
      }
      return new Date(a[field]) - new Date(b[field]);
    });
    return new MockFirestoreQuery(sorted);
  }

  get() {
    return Promise.resolve({
      docs: this.data.map(d => ({
        id: d.id,
        data: () => d,
        exists: true
      })),
      empty: this.data.length === 0
    });
  }

  add(data) {
    const id = 'doc' + Date.now();
    const newDoc = { id, ...data };
    this.data.push(newDoc);
    return Promise.resolve({ id });
  }

  onSnapshot(callback) {
    callback({
      docChanges: () => this.data.map(d => ({
        type: 'added',
        doc: { id: d.id, data: () => d }
      }))
    });
    return () => {}; // unsubscribe
  }
}

class MockFirestoreDocument {
  constructor(id, collection) {
    this.id = id;
    this.collection = collection;
    this.data = collection.data.find(d => d.id === id) || null;
  }

  get() {
    return Promise.resolve({
      id: this.id,
      data: () => this.data,
      exists: !!this.data
    });
  }

  set(data) {
    this.data = { id: this.id, ...data };
    const index = this.collection.data.findIndex(d => d.id === this.id);
    if (index >= 0) {
      this.collection.data[index] = this.data;
    } else {
      this.collection.data.push(this.data);
    }
    return Promise.resolve();
  }

  update(data) {
    if (this.data) {
      this.data = { ...this.data, ...data };
      const index = this.collection.data.findIndex(d => d.id === this.id);
      if (index >= 0) {
        this.collection.data[index] = this.data;
      }
    }
    return Promise.resolve();
  }

  delete() {
    this.collection.data = this.collection.data.filter(d => d.id !== this.id);
    return Promise.resolve();
  }

  collection(name) {
    return new MockFirestoreCollection(name);
  }
}

class MockFirestoreQuery {
  constructor(data) {
    this.data = data;
  }

  get() {
    return Promise.resolve({
      docs: this.data.map(d => ({
        id: d.id,
        data: () => d,
        exists: true
      })),
      empty: this.data.length === 0
    });
  }

  where(field, op, value) {
    let filtered = this.data;
    if (op === '==') {
      filtered = this.data.filter(item => item[field] === value);
    }
    return new MockFirestoreQuery(filtered);
  }

  orderBy(field, direction) {
    const sorted = [...this.data].sort((a, b) => {
      if (direction === 'desc') {
        return new Date(b[field]) - new Date(a[field]);
      }
      return new Date(a[field]) - new Date(b[field]);
    });
    return new MockFirestoreQuery(sorted);
  }
}

class MockFirestore {
  constructor() {
    this.collections = new Map();
    this.persistenceEnabled = false;
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockFirestoreCollection(name));
    }
    return this.collections.get(name);
  }

  doc(path) {
    const parts = path.split('/');
    let current = this.collection(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      if (i % 2 === 1) {
        current = current.doc(parts[i]);
      } else {
        current = current.collection(parts[i]);
      }
    }
    return current;
  }

  enablePersistence(config) {
    this.persistenceEnabled = true;
    return Promise.resolve();
  }

  batch() {
    const operations = [];
    return {
      set: (doc, data) => operations.push({ type: 'set', doc, data }),
      update: (doc, data) => operations.push({ type: 'update', doc, data }),
      delete: (doc) => operations.push({ type: 'delete', doc }),
      commit: () => {
        operations.forEach(op => {
          if (op.type === 'delete') {
            op.doc.delete();
          } else if (op.type === 'set') {
            op.doc.set(op.data);
          } else if (op.type === 'update') {
            op.doc.update(op.data);
          }
        });
        return Promise.resolve();
      }
    };
  }

  static FieldValue = {
    serverTimestamp: () => new Date(),
    delete: () => null
  };

  static Timestamp = {
    now: () => ({
      toDate: () => new Date(),
      toMillis: () => Date.now()
    }),
    fromDate: (date) => ({
      toDate: () => date,
      toMillis: () => date.getTime()
    })
  };
}

// Create global firebase mock
global.firebase = {
  initializeApp: jest.fn(() => ({})),
  auth: jest.fn(() => new MockFirebaseAuth()),
  firestore: jest.fn(() => new MockFirestore()),
  firestore: {
    FieldValue: MockFirestore.FieldValue,
    Timestamp: MockFirestore.Timestamp
  },
  auth: {
    Auth: {
      Persistence: {
        LOCAL: 'local',
        SESSION: 'session',
        NONE: 'none'
      }
    },
    GoogleAuthProvider: class {
      addScope() {}
      setCustomParameters() {}
    }
  }
};

// Export for use in tests
export {
  MockFirebaseAuth,
  MockFirestore,
  MockFirestoreCollection,
  MockFirestoreDocument,
  MockFirestoreQuery
};
