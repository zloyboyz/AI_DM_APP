@@ .. @@
 import { useEffect } from 'react';
-import { SplashScreen } from 'expo-splash-screen';
 
 declare global {
   interface Window {
@@ -8,9 +7,4 @@ declare global {
 }
 
 export function useFrameworkReady() {
-  useEffect(() => {
-    // Hide splash screen when framework is ready
-    SplashScreen?.hideAsync()?.catch(() => {
-      // Ignore errors if splash screen is already hidden
-    });
-  });
+  useEffect(() => {
+    window.frameworkReady?.()
+  })
 }