'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  testConnection,
  checkIsFirestoreAdmin,
  signInWithGooglePopup,
  signOutFirebaseUser,
} from '@/lib/firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isFirestoreAdmin: boolean;
  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  authReady: false,
  isFirestoreAdmin: false,
  signInWithGoogle: signInWithGooglePopup,
  signOutUser: signOutFirebaseUser,
});

export function useFirebase() {
  return useContext(FirebaseContext);
}

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isFirestoreAdmin, setIsFirestoreAdmin] = useState<boolean>(false);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        try {
          const adminStatus = await checkIsFirestoreAdmin(currentUser);
          setIsFirestoreAdmin(adminStatus);
        } catch {
          setIsFirestoreAdmin(false);
        }
      } else {
        setIsFirestoreAdmin(false);
      }
      setAuthReady(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isFirestoreAdmin,
        signInWithGoogle: signInWithGooglePopup,
        signOutUser: signOutFirebaseUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
