import { ChatInterface } from "../components/ChatInterface";
import { Sparkles, Search, FolderOpen, Send } from "lucide-react";

export function ChatAssistant() {
  const features = [
    {
      icon: Search,
      title: "Search Photos",
      description: "Ask in natural language to find photos by person or context.",
    },
    {
      icon: FolderOpen,
      title: "Organize Memory",
      description: "Faces are grouped and can be labeled directly from Gallery.",
    },
    {
      icon: Send,
      title: "Smart Delivery",
      description: "Use backend delivery endpoints for email and WhatsApp sharing.",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-2">AI Chat Assistant</h1>
        <p className="text-gray-500">Natural language photo search for Drishyamitra</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[620px]">
        <ChatInterface />
      </div>
    </div>
  );
}
