import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'warehouses';

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWarehouses(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error (warehouses):', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Add a new warehouse
  const addWarehouse = async (warehouse) => {
    await addDoc(collection(db, COLLECTION), {
      ...warehouse,
      createdAt: serverTimestamp()
    });
  };

  // Delete a warehouse
  const deleteWarehouse = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return { warehouses, loading, error, addWarehouse, deleteWarehouse };
}
