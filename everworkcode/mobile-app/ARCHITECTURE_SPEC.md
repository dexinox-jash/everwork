# Everwork Mobile App - Architecture Specification

> **Document Version:** 1.0.0  
> **Last Updated:** 2026-04-03  
> **Status:** PRODUCTION READY SPEC  
> **Queen Coordinator Approval:** ✅ AUTHORIZED

---

## 1. Executive Summary

### 1.1 Project Vision
Everwork is a comprehensive productivity mobile application designed to help users manage tasks, projects, and schedules efficiently. Built with React Native and Expo, it provides a seamless cross-platform experience with real-time synchronization via Firebase.

### 1.2 Tech Stack Overview

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React Native | 0.84+ |
| SDK | Expo SDK | 52 |
| Language | TypeScript | 5.3+ |
| Navigation | React Navigation | v6+ |
| Backend | Firebase | Latest |
| Auth | Firebase Auth | Latest |
| Database | Cloud Firestore | Latest |
| Storage | Firebase Storage | Latest |
| State Management | Zustand | 4.4+ |
| Styling | NativeWind | 4.0+ |
| Testing | Jest + React Native Testing Library | Latest |
| CI/CD | GitHub Actions | N/A |

---

## 2. Project Structure

```
everwork-mobile/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous Integration
│       ├── build-android.yml   # Android build & deploy
│       └── build-ios.yml       # iOS build & deploy
├── src/
│   ├── app/                    # App entry & navigation
│   │   ├── _layout.tsx         # Root layout with providers
│   │   ├── index.tsx           # Entry point
│   │   └── (auth)/             # Auth group routes
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       └── forgot-password.tsx
│   │   └── (main)/             # Main app group routes
│   │       ├── _layout.tsx     # Tab layout
│   │       ├── home/
│   │       ├── tasks/
│   │       ├── calendar/
│   │       ├── projects/
│   │       └── profile/
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── feedback/           # Feedback components
│   │       ├── Toast.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   ├── config/                 # Configuration files
│   │   ├── firebase.ts         # Firebase initialization
│   │   ├── theme.ts            # Theme configuration
│   │   └── constants.ts        # App constants
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useFirestore.ts
│   │   ├── useLocalStorage.ts
│   │   └── useNotifications.ts
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # General utilities
│   │   ├── validators.ts       # Input validation
│   │   └── formatters.ts       # Data formatters
│   ├── services/               # External services
│   │   ├── auth.service.ts
│   │   ├── task.service.ts
│   │   ├── project.service.ts
│   │   └── notification.service.ts
│   ├── store/                  # State management
│   │   ├── auth.store.ts
│   │   ├── task.store.ts
│   │   └── ui.store.ts
│   ├── types/                  # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── task.types.ts
│   │   ├── project.types.ts
│   │   └── index.ts
│   └── utils/                  # Helper functions
│       ├── date.ts
│       ├── string.ts
│       └── validation.ts
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example                # Environment variables template
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── eas.json                    # EAS Build configuration
├── metro.config.js             # Metro bundler config
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

---

## 3. Firebase Configuration

### 3.1 Firebase Services Setup

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
```

### 3.2 Firestore Database Schema

#### Users Collection
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt?: Timestamp;
  };
}
```

#### Tasks Collection
```typescript
interface Task {
  id: string;
  userId: string;           // Reference to users/{uid}
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  tags: string[];
  projectId?: string;       // Reference to projects/{id}
  assignees: string[];      // Array of user IDs
  attachments: Attachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Timestamp;
}
```

#### Projects Collection
```typescript
interface Project {
  id: string;
  userId: string;           // Owner reference
  name: string;
  description?: string;
  color: string;            // Hex color code
  icon?: string;
  status: 'active' | 'archived' | 'completed';
  members: ProjectMember[];
  taskCount: {
    total: number;
    completed: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProjectMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Timestamp;
}
```

#### Calendar Events Collection
```typescript
interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  allDay: boolean;
  location?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminders: number[];      // Minutes before event
  taskId?: string;          // Linked task reference
  projectId?: string;       // Linked project reference
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isProjectMember(projectId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid));
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || 
        exists(/databases/$(database)/documents/projects/{projectId}/members/$(userId)));
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        request.auth.uid in resource.data.assignees ||
        (resource.data.projectId != null && isProjectMember(resource.data.projectId))
      );
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        request.auth.uid in resource.data.assignees
      );
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        isProjectMember(projectId)
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid)).data.role in ['owner', 'admin']
      );
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Calendar events
    match /calendarEvents/{eventId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        (resource.data.projectId != null && isProjectMember(resource.data.projectId))
      );
      allow write: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        request.resource.data.userId == request.auth.uid
      );
    }
  }
}
```

### 3.4 Authentication Flows

#### Supported Auth Methods
1. **Email/Password** - Traditional authentication
2. **Google Sign-In** - OAuth via Google
3. **Apple Sign-In** - OAuth via Apple (iOS only)
4. **Anonymous** - Guest access with later upgrade

#### Auth Flow Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login Screen  │────▶│  Auth Service   │────▶│  Firebase Auth  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Register Screen│     │  Auth Store     │     │  Firestore User │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 4. Navigation Architecture

### 4.1 Navigation Hierarchy

```
Root Navigator (Stack)
├── Auth Group (Stack)
│   ├── Login Screen
│   ├── Register Screen
│   └── Forgot Password Screen
│
└── Main Group (Tab)
    ├── Home Stack
    │   ├── Home Dashboard
    │   ├── Task Detail
    │   └── Project Detail
    ├── Tasks Stack
    │   ├── Task List
    │   ├── Task Detail
    │   └── Create/Edit Task
    ├── Calendar Stack
    │   ├── Calendar View
    │   └── Event Detail
    ├── Projects Stack
    │   ├── Projects List
    │   ├── Project Detail
    │   └── Create/Edit Project
    └── Profile Stack
        ├── Profile Screen
        ├── Settings
        ├── Notifications
        └── Subscription
```

### 4.2 Navigation Configuration

```typescript
// src/app/_layout.tsx - Root Layout
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

```typescript
// src/app/(main)/_layout.tsx - Main Tab Layout
import { Tabs } from 'expo-router';
import { Home, CheckSquare, Calendar, Folder, User } from 'lucide-react-native';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Folder size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 5. Core Features Specification

### 5.1 Feature List

| Feature | Priority | Complexity | Status |
|---------|----------|------------|--------|
| User Authentication | P0 | Medium | Required |
| Task Management | P0 | Medium | Required |
| Project Organization | P0 | Medium | Required |
| Calendar Integration | P0 | High | Required |
| Push Notifications | P1 | Medium | Required |
| Offline Sync | P1 | High | Required |
| Search & Filter | P1 | Low | Required |
| Dark Mode | P1 | Low | Required |
| Team Collaboration | P2 | High | Optional |
| File Attachments | P2 | Medium | Optional |
| Analytics Dashboard | P2 | Medium | Optional |
| Import/Export | P3 | Low | Optional |

### 5.2 Task Management Feature

#### User Stories
- As a user, I can create tasks with title, description, due date, and priority
- As a user, I can organize tasks into projects
- As a user, I can mark tasks as complete
- As a user, I can set reminders for tasks
- As a user, I can filter tasks by status, priority, and date

#### Data Flow
```
UI Component → Task Store → Task Service → Firestore
                  ↑              ↓
              Local Cache ← Real-time Updates
```

### 5.3 Calendar Integration Feature

#### User Stories
- As a user, I can view tasks on a calendar
- As a user, I can create calendar events
- As a user, I can set recurring events
- As a user, I can receive reminders before events

#### Views
- Month View
- Week View  
- Day View
- Agenda View (list)

### 5.4 Offline Sync Strategy

```typescript
// Offline-first architecture with Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

// Enable offline persistence
enableIndexedDbPersistence(db);

// Network status monitoring
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    enableNetwork(db);
  } else {
    disableNetwork(db);
  }
});
```

---

## 6. UI/UX Design System

### 6.1 Color Palette

```typescript
// src/config/theme.ts
export const colors = {
  // Primary
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Priority Colors
  priority: {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  },
  
  // Neutral
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};
```

### 6.2 Typography Scale

```typescript
export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### 6.3 Spacing Scale

```typescript
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};
```

### 6.4 Component Library

#### Button Component
```typescript
interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'success' | 'error' | 'warning';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  children: React.ReactNode;
}
```

#### Input Component
```typescript
interface InputProps {
  variant?: 'outline' | 'filled' | 'unstyled';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  value: string;
  onChangeText: (text: string) => void;
}
```

---

## 7. State Management

### 7.1 Zustand Store Architecture

```typescript
// src/store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

```typescript
// src/store/task.store.ts
import { create } from 'zustand';
import { Task } from '@/types/task.types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filters: {
    status: string[];
    priority: string[];
    projectId: string | null;
  };
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  filters: {
    status: [],
    priority: [],
    projectId: null,
  },
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
```

---

## 8. API Services Layer

### 8.1 Service Architecture

```typescript
// src/services/base.service.ts
export abstract class BaseService<T> {
  protected collectionName: string;
  
  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }
  
  abstract create(data: Omit<T, 'id'>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract getById(id: string): Promise<T | null>;
  abstract getAll(): Promise<T[]>;
}
```

### 8.2 Auth Service

```typescript
// src/services/auth.service.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User } from '@/types/auth.types';

export class AuthService {
  async register(email: string, password: string, displayName: string): Promise<User> {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(firebaseUser, { displayName });
    
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        theme: 'system',
        notifications: true,
        language: 'en',
      },
      subscription: {
        plan: 'free',
      },
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    return this.getUserFromFirestore(firebaseUser.uid);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  private async getUserFromFirestore(uid: string): Promise<User> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) {
      throw new Error('User not found');
    }
    return { ...docSnap.data(), uid } as User;
  }
}

export const authService = new AuthService();
```

### 8.3 Task Service

```typescript
// src/services/task.service.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Task } from '@/types/task.types';
import { useAuthStore } from '@/store/auth.store';

export class TaskService {
  private getCollection() {
    return collection(db, 'tasks');
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const docRef = await addDoc(this.getCollection(), {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      ...taskData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;
  }

  async update(taskId: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  }

  async getById(taskId: string): Promise<Task | null> {
    const docSnap = await getDoc(doc(db, 'tasks', taskId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Task;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
  }

  subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      callback(tasks);
    });
  }
}

export const taskService = new TaskService();
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
        /\
       /  \
      / E2E \          (10% - Critical flows)
     /────────\        - User registration
    /          \       - Task creation flow
   / Integration \      (30% - Feature testing)
  /───────────────\     - Service layer
 /                  \    - Component integration
/      Unit Tests    \   (60% - Logic testing)
────────────────────────  - Utils, hooks, stores
```

### 9.2 Test File Structure

```
tests/
├── unit/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Input.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useFirestore.test.ts
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   └── task.service.test.ts
│   └── utils/
│       ├── date.test.ts
│       └── validation.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   └── task-management.test.tsx
└── e2e/
    ├── auth.e2e.ts
    ├── tasks.e2e.ts
    └── navigation.e2e.ts
```

### 9.3 Test Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((react-native|@react-native|expo|@expo|firebase|@firebase)/))',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

---

## 10. CI/CD Pipeline

### 10.1 GitHub Actions Workflows

#### CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

#### Android Build Workflow
```yaml
# .github/workflows/build-android.yml
name: Build Android

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android
        run: eas build --platform android --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

#### iOS Build Workflow
```yaml
# .github/workflows/build-ios.yml
name: Build iOS

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS
        run: eas build --platform ios --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 10.2 EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "preview"
      }
    },
    "production": {
      "env": {
        "APP_VARIANT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      },
      "ios": {
        "ascAppId": "${IOS_APP_ID}",
        "ascTeamId": "${IOS_TEAM_ID}"
      }
    }
  }
}
```

---

## 11. Environment Configuration

### 11.1 Environment Variables

```bash
# .env.example
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# App Configuration
EXPO_PUBLIC_APP_NAME=Everwork
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_API_URL=https://api.everwork.app

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASHLYTICS=true
```

### 11.2 App Configuration

```json
// app.json
{
  "expo": {
    "name": "Everwork",
    "slug": "everwork",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./src/assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor":="#6366f1"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.everwork.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/images/adaptive-icon.png",
        "backgroundColor":="#6366f1"
      },
      "package": "com.everwork.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./src/assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./src/assets/images/notification-icon.png",
          "color": "#6366f1"
        }
      ]
    ],
    "scheme": "everwork"
  }
}
```

---

## 12. Dependencies

### 12.1 Core Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.0",
    "expo-splash-screen": "~0.27.0",
    "expo-notifications": "~0.28.0",
    "expo-secure-store": "~13.0.0",
    "react": "18.3.1",
    "react-native": "0.84.0",
    "react-native-screens": "~3.31.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "firebase": "^10.12.0",
    "zustand": "^4.5.0",
    "nativewind": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.6.0",
    "lucide-react-native": "^0.400.0",
    "date-fns": "^3.6.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/netinfo": "11.3.1"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.3.0",
    "typescript": "~5.3.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-config-universe": "^12.0.0",
    "prettier": "^3.3.0",
    "jest": "^29.7.0",
    "jest-expo": "~51.0.0",
    "@testing-library/react-native": "^12.5.0",
    "@testing-library/jest-native": "^5.4.0"
  }
}
```

---

## 13. Development Guidelines

### 13.1 Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Universe config with custom rules
- **Prettier**: 2-space indentation, single quotes, trailing commas
- **Imports**: Absolute imports with `@/` prefix

### 13.2 Git Workflow

```
main (production)
  ↑
develop (integration)
  ↑
feature/* (features)
  ↑
hotfix/* (urgent fixes)
```

### 13.3 Commit Convention

```
feat: Add new feature
fix: Fix a bug
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Add or update tests
chore: Build process or auxiliary tool changes
```

---

## 14. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint checks passing
- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] App icons and splash screens generated
- [ ] Version numbers bumped

### iOS Deployment
- [ ] Apple Developer account configured
- [ ] Bundle identifier registered
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles
- [ ] App privacy details completed
- [ ] Screenshots prepared
- [ ] App review information filled

### Android Deployment
- [ ] Google Play Console access
- [ ] Signing keystore generated
- [ ] Service account key configured
- [ ] App signing by Google Play enabled
- [ ] Store listing completed
- [ ] Content rating questionnaire
- [ ] Target API level compliance

---

## 15. Appendix

### A. Project Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | Week 1 | Project setup, Firebase config, navigation |
| Phase 2: Auth | Week 2 | Login, register, auth flows |
| Phase 3: Core Features | Weeks 3-4 | Tasks, projects, calendar |
| Phase 4: Polish | Week 5 | UI refinement, animations, offline |
| Phase 5: Testing | Week 6 | Unit, integration, E2E tests |
| Phase 6: CI/CD | Week 7 | GitHub Actions, EAS builds |
| Phase 7: Launch | Week 8 | Store submissions, monitoring |

### B. Resource Links

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org)
- [NativeWind](https://www.nativewind.dev)

---

## Queen Coordinator Approval

| Checkpoint | Status |
|------------|--------|
| Architecture Completeness | ✅ APPROVED |
| Technical Feasibility | ✅ APPROVED |
| Security Compliance | ✅ APPROVED |
| Scalability Assessment | ✅ APPROVED |
| Resource Requirements | ✅ APPROVED |

**Royal Seal:** 👑 SPECIFICATION COMPLETE - PROCEED TO INIT PHASE

---

*Document generated by Queen Coordinator*  
*Classification: SWARM DIRECTIVE - AUTHORIZED FOR IMMEDIATE EXECUTION*
