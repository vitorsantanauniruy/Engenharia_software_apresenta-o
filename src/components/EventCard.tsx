import React from 'react';
import { Link } from 'react-router-dom';
import type { EventProps } from '../types/index';

export function EventCard(props: EventProps) {
  // EXTRAÇÃO DEFINITIVA
  const { id, title, date, price, imageUrl } = props;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      <div className="relative overflow-hidden h-48">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          src={imageUrl} // Agora imageUrl existe no escopo!
          alt={title} 
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-indigo-500 text-sm font-semibold mb-1">{date}</p>
        <h3 className="font-bold text-xl mb-4 text-gray-800 line-clamp-2">{title}</h3>
        
        <div className="flex justify-between items-center mt-auto pt-4">
          <div>
            <p className="text-xs text-gray-500">A partir de</p>
            <span className="text-xl font-black text-gray-900">R$ {price.toFixed(2)}</span>
          </div>

          <Link
            to={`/evento/${id}`}
            state={{ event: props }} 
            className="bg-indigo-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-800 transition-colors"
          >
            Comprar
          </Link>
        </div>
      </div>
    </div>
  );
}