import React from 'react';

const TailwindTest = () => {
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Test Tailwind CSS</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-md">
          Boîte Rouge
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
          Boîte Verte
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
          Boîte Bleue
        </div>
        <div className="bg-yellow-500 text-black p-4 rounded-lg shadow-md">
          Boîte Jaune
        </div>
      </div>
      
      <div className="flex flex-col space-y-4">
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors">
          Bouton Primaire
        </button>
        <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md transition-colors">
          Bouton Secondaire
        </button>
        <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md transition-colors">
          Bouton Destructif
        </button>
      </div>
      
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
        <p className="text-base text-foreground mb-2">Mode sombre/clair fonctionne correctement si le fond et le texte changent.</p>
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
      
      <div className="mt-6 flex space-x-2">
        <div className="h-12 w-12 bg-blue-500 animate-pulse rounded-full"></div>
        <div className="h-12 w-12 bg-blue-500 animate-[bounceDot_1.4s_infinite] rounded-full"></div>
      </div>
    </div>
  );
};

export default TailwindTest; 