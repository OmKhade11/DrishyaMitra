import { motion } from "motion/react";

export function PhotoCard({ photo, onClick }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm"
      onClick={onClick}
    >
      <img src={photo.url} alt={photo.title} className="w-full h-48 object-cover" />

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{photo.title}</h3>
        <p className="text-xs text-gray-500">{new Date(photo.date).toLocaleDateString()}</p>
      </div>
    </motion.div>
  );
}
