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

const COLLECTION = 'shipments';

export function useShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setShipments(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error (shipments):', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Add a new shipment
  const addShipment = async (shipment) => {
    await addDoc(collection(db, COLLECTION), {
      ...shipment,
      status: 'pending', // pending, transit, delivered
      createdAt: serverTimestamp()
    });
  };

  // Update shipment status
  const updateShipmentStatus = async (id, newStatus) => {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  };

  // Delete a shipment
  const deleteShipment = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return { shipments, loading, error, addShipment, updateShipmentStatus, deleteShipment };
}
