import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, UserRoundCheck, UserRoundX, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  fetchPeople,
  fetchPhotoFaces,
  fetchPhotos,
  labelFace,
  recognizePhoto,
} from "../../services/drishyaApi";

export function LabelFaces() {
  const [photos, setPhotos] = useState([]);
  const [people, setPeople] = useState([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [faces, setFaces] = useState([]);
  const [activeFaceId, setActiveFaceId] = useState(null);
  const [hoverFaceId, setHoverFaceId] = useState(null);
  const [personName, setPersonName] = useState("");
  const [busy, setBusy] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [imageMetrics, setImageMetrics] = useState({
    displayW: 0,
    displayH: 0,
    naturalW: 1,
    naturalH: 1,
  });

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) || null,
    [photos, selectedPhotoId]
  );

  const identifiedFaces = useMemo(
    () => faces.filter((face) => !!face.person_id),
    [faces]
  );

  const activeFace = useMemo(
    () => identifiedFaces.find((face) => face.id === activeFaceId) || null,
    [identifiedFaces, activeFaceId]
  );

  const scaledFaces = useMemo(() => {
    if (!imageMetrics.displayW || !imageMetrics.displayH) return [];
    const scaleX = imageMetrics.displayW / imageMetrics.naturalW;
    const scaleY = imageMetrics.displayH / imageMetrics.naturalH;
    const pad = 24;

    return identifiedFaces.map((face) => {
      const x = face.bbox.x * scaleX;
      const y = face.bbox.y * scaleY;
      const w = face.bbox.w * scaleX;
      const h = face.bbox.h * scaleY;
      return {
        ...face,
        scaled: {
          x: Math.max(0, x - pad),
          y: Math.max(0, y - pad),
          w: w + pad * 2,
          h: h + pad * 2,
        },
      };
    });
  }, [identifiedFaces, imageMetrics]);

  const hoverFace = useMemo(
    () => scaledFaces.find((face) => face.id === hoverFaceId) || null,
    [scaledFaces, hoverFaceId]
  );

  const loadBase = async () => {
    try {
      const [photoList, peopleList] = await Promise.all([fetchPhotos(), fetchPeople()]);
      setPhotos(photoList);
      setPeople(peopleList);
      if (!selectedPhotoId && photoList.length) {
        setSelectedPhotoId(photoList[0].id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load photos");
    }
  };

  const loadFaces = async (photoId) => {
    if (!photoId) return;
    try {
      const items = await fetchPhotoFaces(photoId);
      setFaces(items);
      setActiveFaceId(items.find((face) => !!face.person_id)?.id || null);
      setHoverFaceId(null);
    } catch (error) {
      toast.error(error.message || "Failed to load face list");
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!selectedPhotoId) return;

    let cancelled = false;
    const autoDetectAndLoad = async () => {
      try {
        setDetecting(true);
        const currentFaces = await fetchPhotoFaces(selectedPhotoId);
        if (cancelled) return;

        if (!currentFaces.length) {
          await recognizePhoto(selectedPhotoId);
          if (cancelled) return;
          const detected = await fetchPhotoFaces(selectedPhotoId);
          if (cancelled) return;
          setFaces(detected);
          setActiveFaceId(detected.find((face) => !!face.person_id)?.id || null);
        } else {
          setFaces(currentFaces);
          setActiveFaceId(currentFaces.find((face) => !!face.person_id)?.id || null);
        }
      } catch {
        // Keep page usable even if detection call fails for one photo.
      } finally {
        if (!cancelled) {
          setDetecting(false);
        }
      }
    };

    autoDetectAndLoad();
    return () => {
      cancelled = true;
    };
  }, [selectedPhotoId]);

  const handleDetectAgain = async () => {
    if (!selectedPhotoId) return;
    try {
      setDetecting(true);
      const result = await recognizePhoto(selectedPhotoId);
      toast.success(`Detection updated: ${result.faces_detected || 0} face(s)`);
      await loadFaces(selectedPhotoId);
      await loadBase();
    } catch (error) {
      toast.error(error.message || "Face detection failed");
    } finally {
      setDetecting(false);
    }
  };

  const handleLabel = async () => {
    if (!activeFace || !personName.trim()) return;
    try {
      setBusy(true);
      await labelFace(activeFace.id, personName.trim());
      toast.success("Face labeled");
      setPersonName("");
      await Promise.all([loadFaces(selectedPhotoId), loadBase()]);
    } catch (error) {
      toast.error(error.message || "Failed to label face");
    } finally {
      setBusy(false);
    }
  };

  const handleImageHover = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = scaledFaces
      .filter((face) => x >= face.scaled.x && x <= face.scaled.x + face.scaled.w && y >= face.scaled.y && y <= face.scaled.y + face.scaled.h)
      .sort((a, b) => a.scaled.w * a.scaled.h - b.scaled.w * b.scaled.h)[0];

    setHoverFaceId(hit?.id || null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Label Faces</h1>
          <p className="text-gray-500 mt-1">Hover directly on a face in the image to see saved name.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-3 py-2 bg-white min-w-[260px]"
            value={selectedPhotoId || ""}
            onChange={(e) => setSelectedPhotoId(Number(e.target.value))}
          >
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                #{photo.id} - {photo.filename}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={handleDetectAgain} disabled={!selectedPhotoId || detecting}>
            <WandSparkles className="w-4 h-4 mr-2" />
            {detecting ? "Detecting..." : "Detect Again"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white border rounded-xl p-4">
          {!selectedPhoto ? (
            <p className="text-sm text-gray-500">No photos found. Upload photos first.</p>
          ) : (
            <div className="relative inline-block max-w-full">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                className="max-h-[70vh] w-auto rounded-lg block"
                onLoad={(e) => {
                  setImageMetrics({
                    displayW: e.currentTarget.clientWidth,
                    displayH: e.currentTarget.clientHeight,
                    naturalW: e.currentTarget.naturalWidth || 1,
                    naturalH: e.currentTarget.naturalHeight || 1,
                  });
                }}
              />

              <div
                className="absolute inset-0"
                onMouseMove={handleImageHover}
                onMouseLeave={() => setHoverFaceId(null)}
              >
                {hoverFace && (
                  <button
                    type="button"
                    onClick={() => setActiveFaceId(hoverFace.id)}
                    className={`absolute border-2 rounded-md ${
                      hoverFace.person_id ? "border-emerald-500" : "border-pink-500"
                    }`}
                    style={{
                      left: `${hoverFace.scaled.x}px`,
                      top: `${hoverFace.scaled.y}px`,
                      width: `${hoverFace.scaled.w}px`,
                      height: `${hoverFace.scaled.h}px`,
                    }}
                  >
                    <span
                      className={`absolute -top-7 left-0 px-2 py-0.5 text-xs rounded-md text-white whitespace-nowrap shadow ${
                        hoverFace.person_id ? "bg-emerald-600" : "bg-pink-600"
                      }`}
                    >
                      {hoverFace.person_name || "Unknown"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4 space-y-4 max-h-[76vh] overflow-y-auto">
          <h2 className="text-lg font-semibold">Labeled Faces ({identifiedFaces.length})</h2>

          {identifiedFaces.map((face) => {
            const isKnown = !!face.person_id;
            return (
              <button
                key={face.id}
                type="button"
                onMouseEnter={() => setHoverFaceId(face.id)}
                onClick={() => setActiveFaceId(face.id)}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  face.id === activeFaceId ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{face.person_name || `Unknown #${face.id}`}</p>
                  {isKnown ? (
                    <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      In database
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-pink-700 bg-pink-50 px-2 py-1 rounded-full">
                      <UserRoundX className="w-3 h-3 mr-1" />
                      Not in database
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Detector: {face.detector} | Confidence: {face.confidence?.toFixed?.(2) || "N/A"}
                </p>
              </button>
            );
          })}

          {!identifiedFaces.length && <p className="text-sm text-gray-500">No identified faces in this photo.</p>}

          {activeFace && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Label selected face</p>
              <Input
                list="people-suggestions"
                placeholder="Enter person name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
              <datalist id="people-suggestions">
                {people.map((person) => (
                  <option key={person.id} value={person.name} />
                ))}
              </datalist>
              <Button onClick={handleLabel} disabled={busy || !personName.trim()} className="w-full">
                <UserRoundCheck className="w-4 h-4 mr-2" />
                Save Label
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
