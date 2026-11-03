// @ts-ignore Expo Router exposes its registered root component through this entry point.
import { App } from 'expo-router/build/qualified-entry';
// @ts-ignore Expo Router's rendering helper is an internal entry API required for a custom main.
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

renderRootComponent(App);
