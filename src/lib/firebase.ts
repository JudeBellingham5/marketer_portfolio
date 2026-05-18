import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const getPortfolio = async () => {
  const docRef = doc(db, 'portfolio', 'main');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const savePortfolio = async (data: any) => {
  const docRef = doc(db, 'portfolio', 'main');
  await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
};

export const getProjects = async () => {
  const projectsCol = collection(db, 'projects');
  const q = query(projectsCol, orderBy('order', 'asc'));
  const projectSnapshot = await getDocs(q);
  const projectList = projectSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return projectList;
};

export const saveProject = async (id: string, data: any) => {
  const docRef = doc(db, 'projects', id);
  await setDoc(docRef, data);
};
