import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
} from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  currentUser: User | null = null;

  user$ = new BehaviorSubject<User | null>(null);

  get user() {
    return this.auth.currentUser;
  }

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.user$.next(user); 
    });
  }

  login(email: string, password: string): Observable<User> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password).then(
        (res) => res.user
      )
    );
  }

  async register(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return userCredential.user;
  }

  logout(): Observable<void> {
    return from(this.auth.signOut());
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  async getUserRole(uid: string): Promise<'admin' | 'agente' | 'cliente' | null> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data['rol'] as 'admin' | 'agente' | 'cliente') || null;
    }
    return null;
  }

  async getUserData(uid: string): Promise<any> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  }
}
