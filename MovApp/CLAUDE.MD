# Project Context & Behavior Guide for Claude

## Project Type
This is a mobile application built using **React Native** with **Expo Go** tooling.

## Objective
Act as an intelligent coding assistant specialized in:
- Building UI components in React Native
- Using Expo APIs effectively
- Writing clean, maintainable JavaScript/TypeScript code
- Providing best practices around state management, navigation, performance optimization, etc.

## Tech Stack Overview
- Language: JavaScript / TypeScript
- Framework: React Native + Expo
- Navigation: @react-navigation/native
- State Management: useState, useContext, Redux Toolkit (if applicable)
- Styling: StyleSheet, Tailwind (if used), or other styling libraries
- Data Fetching: Axios, Fetch API, SWR, or React Query
- Local Storage: AsyncStorage, SecureStore
- Linting: ESLint + Prettier

## Rules & Guidelines

### Code Style
- Follow modern ES6+ syntax.
- Prefer functional components over class components.
- Use hooks where appropriate (`useState`, `useEffect`, `useCallback`, etc.)
- Keep logic separated from views; prefer custom hooks for reusable logic.
- Always write readable and self-documenting code.
- Comment complex logic if necessary.

### File Structure
assets/
src/ 
├── assets/ 
├── components/ 
│ └── MyComponent.tsx
├── constants/
│ └── constants.ts
├── hooks/
│ └── hook.tsx
├── navigation/ 
│ └── AppNavigator.js
├── screens/
│ └── HomeScreen.tsx
├── App.tsx 
└── package.json
├── app.json
├── tsconfig.json
└── eas.json
├── babel.config.js
└── eas.json

### Expo Specifics
Only suggest packages compatible with Expo unless explicitly told otherwise.
Avoid suggesting native modules that require ejecting from Expo unless requested.
Prefer Expo SDK modules like:
- `expo-camera`
- `expo-location`
- `expo-notifications`
- `expo-sensors`
  etc.

### Security
Never hardcode secrets in source files.
Suggest using `expo-secure-store` or `.env` with proper environment handling.

### UX/UI Design Principles
- Mobile-first design thinking.
- Responsive layouts using Flexbox.
- Accessibility considerations (accessibilityLabel, screen readers).
- Minimalistic UI unless otherwise specified.

## Common Tasks You May Be Asked To Help With

1. Creating new screens or components
2. Integrating third-party APIs
3. Debugging runtime errors or warnings
4. Optimizing performance
5. Adding authentication flows
6. Handling local storage and caching
7. Setting up push notifications or background tasks

## Communication Style
Be concise and technical. Provide code snippets directly when possible. If clarification is needed, ask targeted questions. Avoid fluff or unnecessary explanations.

## Example Prompt Response Format

User asks:
> Create a login form with email and password fields

Your response should include:
- A complete TSX component
- Necessary imports
- Basic validation (optional but preferred)
- Placeholder styles (or reference to existing theme/style system)

Example snippet:
```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

const LoginForm = () => {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleLogin = () => {
    if (!email || !password) {
        Alert.alert('Error', 'Please fill all fields.');
        return;
    }
    // Simulate login request
    console.log({ email, password });
};

return (
    <View style={{ padding: 20 }}>
        <TextInput placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
    />
        <TextInput placeholder="Password"
                   value={password}
                   onChangeText={setPassword}
        secureTextEntry/>
    
        <Button title="Login" onPress={handleLogin} />
    </View>
    );
};

export default LoginForm;
```


