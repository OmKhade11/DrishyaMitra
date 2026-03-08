import { useState } from "react";
import { Images, UserCog, Trash2, Brain, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { deletePerson, renamePerson, scanTrainMatchPerson, trainAndMatchPerson } from "../../services/drishyaApi";

export function PersonCard({ person, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [busy, setBusy] = useState(false);
  const initials = person.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleRename = async () => {
    if (!name.trim()) return;
    try {
      await renamePerson(person.id, name.trim());
      toast.success("Renamed person successfully");
      setEditing(false);
      onUpdated?.();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(`Delete ${person.name}? This will unlabel related faces.`);
    if (!ok) return;

    try {
      await deletePerson(person.id);
      toast.success("Person deleted successfully");
      onUpdated?.();
    } catch (error) {
      toast.error(error.message || "Failed to delete person");
    }
  };

  const handleTrainAndMatch = async () => {
    const idsInput = window.prompt(
      "Optional: enter photo IDs to target (comma-separated). Leave empty to process all photos.",
      ""
    );

    let photoIds = null;
    if (idsInput && idsInput.trim()) {
      const parsed = idsInput
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
      if (!parsed.length) {
        toast.error("No valid photo IDs provided");
        return;
      }
      photoIds = parsed;
    }

    try {
      setBusy(true);
      const forceAssign = Array.isArray(photoIds) && photoIds.length > 0;
      const result = await trainAndMatchPerson(person.id, photoIds, 0.55, true, forceAssign);
      toast.success(
        `Train+Match done: processed ${result.photos_processed}, created ${result.faces_created}, matched ${result.auto_matched_faces}, assigned ${result.forced_assigned_faces || 0}`
      );
      onUpdated?.();
    } catch (error) {
      toast.error(error.message || "Train+Match failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAutoComplete = async () => {
    const ok = window.confirm(
      `Run full auto mode for ${person.name}? This will scan all photos and can assign remaining unknown faces to ${person.name}.`
    );
    if (!ok) return;

    try {
      setBusy(true);
      const result = await scanTrainMatchPerson(person.id, 0.6, true, 2000);
      toast.success(
        `Auto complete done: processed ${result.photos_processed}, created ${result.faces_created}, matched ${result.auto_matched_faces}, assigned ${result.forced_assigned_faces || 0}`
      );
      onUpdated?.();
    } catch (error) {
      toast.error(error.message || "Auto complete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md p-6"
    >
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-4 ring-purple-50 flex items-center justify-center">
            <span className="text-white font-semibold text-2xl">{initials}</span>
          </div>

          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center border-4 border-white">
            <Images className="w-4 h-4 text-white" />
          </div>
        </div>

        {editing ? (
          <div className="w-full space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button size="sm" className="w-full" onClick={handleRename}>
              Save
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{person.name}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {person.photo_count || 0} {(person.photo_count || 0) === 1 ? "photo" : "photos"}
            </p>

            <div className="w-full grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoComplete} disabled={busy}>
                <Zap className="w-4 h-4 mr-2" />
                Auto Complete (1-Click)
              </Button>
              <Button variant="outline" size="sm" onClick={handleTrainAndMatch} disabled={busy}>
                <Brain className="w-4 h-4 mr-2" />
                Train + Match Photos
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <UserCog className="w-4 h-4 mr-2" />
                  Rename
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
