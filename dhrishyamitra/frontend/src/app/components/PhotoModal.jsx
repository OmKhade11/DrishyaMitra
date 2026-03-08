import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { Download, Trash2, UserRoundCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { deletePhoto, labelFace } from "../../services/drishyaApi";

export function PhotoModal({ photo, isOpen, onClose, onUpdated, onDeleted }) {
  const [personName, setPersonName] = useState("");
  const [activeFaceId, setActiveFaceId] = useState(null);
  const [busy, setBusy] = useState(false);

  const selectedFace = useMemo(
    () => photo?.faces?.find((face) => face.id === activeFaceId),
    [photo, activeFaceId]
  );

  if (!photo) return null;

  const handleDownload = () => {
    window.open(photo.url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    try {
      setBusy(true);
      await deletePhoto(photo.id);
      toast.success("Photo deleted");
      onDeleted?.(photo.id);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLabel = async () => {
    if (!selectedFace || !personName.trim()) return;

    try {
      setBusy(true);
      await labelFace(selectedFace.id, personName.trim());
      toast.success("Face labeled successfully");
      setPersonName("");
      setActiveFaceId(null);
      onUpdated?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogTitle className="sr-only">{photo.title}</DialogTitle>
        <DialogDescription className="sr-only">Photo details and face labels.</DialogDescription>

        <div className="grid lg:grid-cols-2 h-full">
          <div className="relative bg-black flex items-center justify-center p-6">
            <img src={photo.url} alt={photo.title} className="max-h-[80vh] object-contain" />
          </div>

          <div className="bg-white overflow-y-auto p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">{photo.title}</h2>
              <p className="text-sm text-gray-500">{new Date(photo.date).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Detected Faces</h3>
              <div className="space-y-2">
                {photo.faces?.length ? (
                  photo.faces.map((face) => (
                    <button
                      key={face.id}
                      type="button"
                      onClick={() => setActiveFaceId(face.id)}
                      className={`w-full text-left rounded border p-3 ${
                        activeFaceId === face.id ? "border-purple-500 bg-purple-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{face.person_name || "Unknown person"}</p>
                        <Badge variant="outline">Face #{face.id}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Detector: {face.detector} | Confidence: {face.confidence?.toFixed?.(2) || "N/A"}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No faces found for this photo.</p>
                )}
              </div>
            </div>

            {selectedFace && (
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Label selected face</p>
                <div className="flex gap-2">
                  <Input
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Enter person name"
                  />
                  <Button onClick={handleLabel} disabled={busy || !personName.trim()}>
                    <UserRoundCheck className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600"
                onClick={handleDelete}
                disabled={busy}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
