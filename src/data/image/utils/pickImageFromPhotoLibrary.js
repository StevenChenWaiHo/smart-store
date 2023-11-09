import * as ImagePicker from 'expo-image-picker';

export default async function pickImageFromPhotoLibrary() {

    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        allowsMultipleSelection: false,
        quality: 1,
    });

    if (!result.canceled) {
        return (result.assets[0].uri);
    }

    return null
}