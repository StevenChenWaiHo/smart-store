# SmartStore
## Background
This app is used to manage groceries and remind users when an item is expiring

# Download 
[Google App Store](https://play.google.com/store/apps/details?id=com.hoho.comsci.smartstore)

# Features
* Scan barcode to recognise a product
* Set notifications to remind expiring items

# Support
* iOS (Coming Soon)
* Android

# Demo


https://github.com/StevenChenWaiHo/smart-store/assets/122108964/e3f1ac1e-f6e4-4049-9c23-21b6dfdf8456


# Special Thanks
* <a href="https://world.openfoodfacts.org/">Open Food Facts<a> for providing barcode-to-product API

# For developers

# Development Enviornment
```
npm install
npm run [start/ios/android/web]
```


## Notes
1. The project requires custom patches for it to works the patches are in the folder 'patches', npm install should patch the packages automatically. If not use patch-packages to fix it.

## Error
For error:
java.lang.SecurityException: Shell does not have permission to access user 150
https://github.com/expo/expo/issues/22473#issuecomment-1546718389
