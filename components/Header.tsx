import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-10">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C9C] to-[#FF5A70]">
        Ontop Learning Coach
      </h1>
      <p className="mt-2 text-lg text-[#FFBDC6]">
        Your personal AI guide to crushing your career goals.
      </p>
    </header>
  );
};

export default Header;