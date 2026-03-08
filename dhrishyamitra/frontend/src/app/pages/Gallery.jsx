import { useEffect, useMemo, useState } from "react";
import { PhotoCard } from "../components/PhotoCard";
import { PhotoModal } from "../components/PhotoModal";
import { Filter, SlidersHorizontal, Grid3x3, LayoutGrid, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion } from "motion/react";
import { toast } from "sonner";
import { fetchPhotos } from "../../services/drishyaApi";

export function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterBy, setFilterBy] = useState("all");
  const [gridSize, setGridSize] = useState("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPhotos = async (search = "") => {
    try {
      setLoading(true);
      const list = await fetchPhotos({ q: search });
      setPhotos(list);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (filterBy === "all") return true;
      if (filterBy === "people") return photo.faces.length > 0;
      if (filterBy === "landscape") return photo.faces.length === 0;
      return true;
    });
  }, [photos, filterBy]);

  const sortedPhotos = useMemo(() => {
    return [...filteredPhotos].sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [filteredPhotos, sortBy]);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPhotos(searchQuery.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Gallery</h1>
          <p className="text-gray-500 mt-1">{sortedPhotos.length} photos</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              <SelectItem value="people">With People</SelectItem>
              <SelectItem value="landscape">No Faces</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <Button
              variant={gridSize === "medium" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setGridSize("medium")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={gridSize === "large" ? "secondary" : "ghost"}
              size="icon"
              className="w-8 h-8"
              onClick={() => setGridSize("large")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="max-w-xl">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or person name..."
          />
          <Button type="submit">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading photos...</p>
      ) : (
        <motion.div
          layout
          className={`grid gap-6 ${
            gridSize === "large" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {sortedPhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={() => handlePhotoClick(photo)} />
          ))}
        </motion.div>
      )}

      {!loading && sortedPhotos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No photos found with the current filters.</p>
        </div>
      )}

      <PhotoModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={() => loadPhotos(searchQuery.trim())}
        onDeleted={(deletedId) => {
          setPhotos((prev) => prev.filter((photo) => photo.id !== deletedId));
          setSelectedPhoto(null);
        }}
      />
    </div>
  );
}
