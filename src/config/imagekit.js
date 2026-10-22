const ImageKit = require("imagekit");

const getImageKit = () => {
    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY } = process.env;

    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY) {
        throw new Error("ImageKit environment variables are required");
    }

    return new ImageKit({
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dew6dfilek'
    });
};

const uploadFile = async (file) => {
    const response = await getImageKit().upload({
        file: file.buffer,
        fileName: `car-${Date.now()}.jpg`,
        folder: "/Local-Car-Rental"
    });

    return response.url;
};

module.exports = {
    uploadFile
};