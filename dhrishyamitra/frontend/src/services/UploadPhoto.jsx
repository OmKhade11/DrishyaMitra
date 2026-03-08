import { uploadPhoto } from "../services/uploadService";

function UploadPhoto() {

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    const result = await uploadPhoto(file);

    console.log(result);
  };

  return (
    <div>
      <h2>Upload Photo</h2>
      <input type="file" onChange={handleUpload} />
    </div>
  );
}

export default UploadPhoto;