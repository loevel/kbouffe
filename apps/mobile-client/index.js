// Explicit local entry point so Metro always finds it — avoids the monorepo
// symlink issue where expo/AppEntry.js tries to import ../../App from the
// wrong location.
import 'expo-router/entry';
