const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: 'public_/L/B/TAKmXZ1a+Tg90aInRuEyFY=',
    privateKey: 'private_ZxBJF39cNnUP9vvkBdXv4P4icAI=',
    urlEndpoint: 'https://ik.imagekit.io/dew6dfilek'
});

const uploadFile = async (file) => {

    const response = await imagekit.upload({
        file: file.buffer,
        fileName: `car-${Date.now()}.jpg`,
        folder: "/Local-Car-Rental"
    });

    return response.url;
};

module.exports = {
    imagekit,
    uploadFile
};