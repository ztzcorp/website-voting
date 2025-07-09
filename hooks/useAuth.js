// hooks/useAuth.js
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Sesuaikan path jika firebase.js ada di root

export function useAuth() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in
        setAuthUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          setUserProfile(null);
        }
      } else {
        // User is signed out
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { authUser, userProfile, loading };
}