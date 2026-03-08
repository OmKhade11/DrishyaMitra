import { useMemo, useState } from "react";
import { Upload as UploadIcon, Image, X, CheckCircle2, Brain } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPhoto } from "../../services/drishyaApi";

export function Upload() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const completedCount = useMemo(
    () => files.filter((file) => file.status === "completed").length,
    [files]
  );

  const updateFile = (fileId, patch) => {
    setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, ...patch } : file)));
  };

  const uploadFile = async (item) => {
    try {
      updateFile(item.id, { progress: 40, status: "uploading" });
      const photo = await uploadPhoto(item.file);
      updateFile(item.id, { progress: 100, status: "completed", photo });
      toast.success(`${item.name} uploaded`, {
        description: `Detected ${photo.faces.length} face(s)` ,
      });
    } catch (error) {
      updateFile(item.id, { status: "failed", error: error.message });
      toast.error(`Failed: ${item.name}`, { description: error.message });
    }
  };

  const handleFiles = (selectedFiles) => {
    const newItems = selectedFiles
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "queued",
        file,
      }));

    if (!newItems.length) {
      toast.error("Please select image files only");
      return;
    }

    setFiles((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => uploadFile(item));
  };

  const handleFileSelect = (e) => {
    handleFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (fileId) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Upload Photos</h1>
        <p className="text-gray-500 mt-1">Upload and auto-detect faces instantly</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-white"
        }`}
      >
        <input id="upload-input" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <UploadIcon className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Drop photos here or click to browse</h3>
            <p className="text-sm text-gray-500">JPG, PNG, WEBP supported</p>
          </div>
          <label htmlFor="upload-input">
            <Button asChild>
              <span>
                <Image className="w-4 h-4 mr-2" />
                Choose Photos
              </span>
            </Button>
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">
            Upload Queue ({completedCount}/{files.length} completed)
          </h2>

          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      {file.status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>

                    {file.status !== "completed" && file.status !== "failed" && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-1.5" />
                        <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}

                    {file.status === "completed" && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        {file.photo?.faces?.length || 0} face(s) detected
                      </p>
                    )}

                    {file.status === "failed" && <p className="text-xs text-red-600 mt-1">{file.error}</p>}
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
