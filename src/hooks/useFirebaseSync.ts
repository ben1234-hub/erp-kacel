import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query,
  updateDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function useFirebaseSync<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data() } as T);
        });
        setData(items.length > 0 ? items : initialData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionName);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, initialData]);

  const add = async (item: T) => {
    try {
      await setDoc(doc(db, collectionName, item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${collectionName}/${item.id}`);
    }
  };

  const update = async (item: T) => {
    try {
      await updateDoc(doc(db, collectionName, item.id), item as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${item.id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  const clearAll = async () => {
    try {
      const q = query(collection(db, collectionName));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionName);
    }
  };

  const saveAll = async (items: T[]) => {
    // This is a bit heavy but used for resets or bulk imports
    for (const item of items) {
      await add(item);
    }
  };

  return { data, loading, add, update, remove, clearAll, saveAll };
}
