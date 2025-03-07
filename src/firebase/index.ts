import { initializeApp } from "firebase/app";
import * as Firestore from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA_GQrQGrfwtBNv_y0vRoTJD0u0VYSFrng",
    authDomain: "inecobbdd.firebaseapp.com",
    projectId: "inecobbdd",
    storageBucket: "inecobbdd.firebasestorage.app",
    messagingSenderId: "482260606741",
    appId: "1:482260606741:web:6a57d8e499106e9c75931c"
};


const app = initializeApp(firebaseConfig);
export const firestoreDB = Firestore.getFirestore(app);

export function getCollection<T>(path: string) {
    return Firestore.collection(firestoreDB, path) as Firestore.CollectionReference<T>
}

export async function deleteDocument(path: string, id: string) {
    const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
    await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
    const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
    await Firestore.updateDoc(doc, data)
}

const auth = getAuth(app); 
export { auth };