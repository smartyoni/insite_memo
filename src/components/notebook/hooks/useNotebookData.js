import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

export function useNotebookData(db) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templates2, setTemplates2] = useState([]);

  // 1. Subscribe to Categories
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategories(catList);
    }, (err) => {
      console.error("Firestore categories snapshot error:", err);
    });
    return () => unsubscribe();
  }, [db]);

  // 1.5. Subscribe to Category Groups
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'categoryGroups'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setCategoryGroups(list);
    }, (err) => {
      console.error("Firestore categoryGroups snapshot error:", err);
    });
    return () => unsubscribe();
  }, [db]);

  // 2. Subscribe to Items (Default order: ascending)
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'items'), orderBy('updatedAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setItems(itemList);
    }, (err) => {
      console.error("Firestore items snapshot error:", err);
    });
    return () => unsubscribe();
  }, [db]);

  // 2.5. Subscribe to Templates in Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'templates'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTemplates(list);
    }, (err) => {
      console.error("Firestore templates snapshot error:", err);
    });
    return () => unsubscribe();
  }, [db]);

  // 2.6. Subscribe to Templates2 in Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'templates2'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTemplates2(list);
    }, (err) => {
      console.error("Firestore templates2 snapshot error:", err);
    });
    return () => unsubscribe();
  }, [db]);

  return {
    categories,
    setCategories,
    items,
    setItems,
    categoryGroups,
    setCategoryGroups,
    templates,
    setTemplates,
    templates2,
    setTemplates2
  };
}
