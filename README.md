# 💰 Controle de Gastos

Next.js 14 + Firebase + Vercel

## Setup local

```bash
npm install
cp .env.local.example .env.local
# Preencha as variáveis do Firebase
npm run dev
```

## Configurando o Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto → **Adicionar app Web**
3. Copie as credenciais para `.env.local`
4. No Firebase Console:
   - **Authentication** → Ativar provedor **E-mail/Senha**
   - **Firestore Database** → Criar banco → Modo produção
5. Em **Firestore → Regras**, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Deploy na Vercel

1. Push no GitHub
2. [vercel.com](https://vercel.com) → Import projeto
3. Em **Environment Variables**, adicione todas as `NEXT_PUBLIC_FIREBASE_*`
4. Deploy ✅
