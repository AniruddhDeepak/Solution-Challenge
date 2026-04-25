import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'inventory';

export function useInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Add a new item
  const addItem = async (item) => {
    await addDoc(collection(db, COLLECTION), {
      ...item,
      createdAt: serverTimestamp()
    });
  };

  // Update quantity after deployment
  const deployItem = async (id, newCount) => {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      count: newCount,
      status: newCount <= 10 ? 'Low Stock' : 'In Stock'
    });
  };

  // Update quantity after restock
  const restockItem = async (id, newCount) => {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      count: newCount,
      status: newCount <= 10 ? 'Low Stock' : 'In Stock'
    });
  };

  // Delete an item
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return { items, loading, error, addItem, deployItem, restockItem, deleteItem };
}
