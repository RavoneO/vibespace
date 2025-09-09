
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useNotifications() {
  const { userProfile, isGuest } = useAuth();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    if (!userProfile || isGuest) {
        setHasUnreadNotifications(false);
        return;
    }

    const activityCollection = collection(db, 'activity');
    const q = query(
      activityCollection,
      where('notifiedUserId', '==', userProfile.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    }, (error) => {
      console.error("Error listening for notifications:", error);
      setHasUnreadNotifications(false);
    });

    return () => unsubscribe();
  }, [userProfile, isGuest]);

  return { hasUnreadNotifications };
}

    