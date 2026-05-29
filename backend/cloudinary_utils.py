from cloudinary.uploader import upload

def upload_image(image_path):
    result = upload(
        image_path,
        folder="helmet_violations"
    )

    return result["secure_url"]