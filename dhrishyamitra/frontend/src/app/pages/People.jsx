import { useEffect, useMemo, useState } from "react";
import { PersonCard } from "../components/PersonCard";
import { UserPlus, Search, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import {
  createPerson,
  fetchPeople,
  fetchPeopleSummary,
  scanUnprocessedPhotos,
} from "../../services/drishyaApi";

export function People() {
  const [people, setPeople] = useState([]);
  const [summary, setSummary] = useState({
    recognized_people: 0,
    recognized_faces: 0,
    unknown_faces: 0,
    total_faces: 0,
    photos_scanned: 0,
    total_photos: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [newPerson, setNewPerson] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPeople = async () => {
    try {
      const [list, stats] = await Promise.all([fetchPeople(), fetchPeopleSummary()]);
      setPeople(list);
      setSummary(stats);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const filteredPeople = useMemo(
    () => people.filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [people, searchQuery]
  );

  const handleScanPhotos = async () => {
    try {
      setBusy(true);
      const result = await scanUnprocessedPhotos(200);
      await loadPeople();

      toast.success("Face scan completed", {
        description:
          `Processed ${result.photos_processed} photo(s), created ${result.faces_created} face entries, and auto-matched ${result.auto_matched_faces || 0} face(s) to known people.`,
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddPerson = async () => {
    if (!newPerson.trim()) return;

    try {
      setBusy(true);
      await createPerson(newPerson.trim());
      setNewPerson("");
      toast.success("Person added");
      await loadPeople();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">People</h1>
          <p className="text-gray-500 mt-1">{filteredPeople.length} recognized people</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleScanPhotos} disabled={busy}>
            <Sparkles className="w-4 h-4 mr-2" />
            Scan Photos
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500">Scanned Photos</p>
          <p className="text-2xl font-semibold">{summary.photos_scanned}/{summary.total_photos}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500">Recognized Faces</p>
          <p className="text-2xl font-semibold">{summary.recognized_faces}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-700">Unknown Faces</p>
          <p className="text-2xl font-semibold text-amber-800">{summary.unknown_faces}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add new person"
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
          />
          <Button onClick={handleAddPerson} disabled={busy || !newPerson.trim()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-purple-100">
        <p className="text-gray-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          After you label one face as a person (e.g., om), Scan Photos will auto-match similar faces in other photos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map((person) => (
          <PersonCard key={person.id} person={person} onUpdated={loadPeople} />
        ))}
      </div>

      {filteredPeople.length === 0 && <p className="text-gray-500">No people found matching your search.</p>}
    </div>
  );
}
