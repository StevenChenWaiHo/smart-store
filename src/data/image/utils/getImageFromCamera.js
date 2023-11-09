import * as ImagePicker from 'expo-image-picker';

export default async function getImageFromCamera() {

    let result = await ImagePicker.launchCameraAsync({
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