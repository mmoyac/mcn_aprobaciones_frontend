'use client';

import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Smartphone, Monitor } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  numeroDocumento: number;
  onDownload: (numero: number) => void;
}

export default function PDFViewer({ 
  pdfUrl, 
  title, 
  numeroDocumento, 
  onDownload 
}: PDFViewerProps) {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    // Detección mejorada de dispositivos
    const userAgent = navigator.userAgent.toLowerCase();
    const androidDetected = /android/i.test(userAgent);
    const iosDetected = /iphone|ipad|ipod/i.test(userAgent);
    const mobileDetected = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    setIsAndroid(androidDetected);
    setIsIOS(iosDetected);
    setIsMobile(mobileDetected);
    
    // En iOS el iframe funciona mejor que en Android
    setShowIframe(iosDetected || !mobileDetected);
  }, []);

  // Para Android: mostrar opciones optimizadas
  if (isAndroid) {
    return (
      <div className="flex flex-col h-full">
        {/* Header con opciones principales */}
        <div className="bg-slate-800 p-4 border-b border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Visualización Android</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en navegador
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDownload(numeroDocumento)}
                className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              
              <button
                onClick={() => setShowIframe(!showIframe)}
                className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors text-sm"
              >
                <Monitor className="w-4 h-4" />
                {showIframe ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Contenido condicional */}
        <div className="flex-1 overflow-hidden">
          {showIframe ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
              className="w-full h-full border-0"
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="bg-slate-800 rounded-lg p-6 max-w-sm">
                <Smartphone className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                <h3 className="text-white font-medium mb-2">Documento PDF</h3>
                <p className="text-slate-300 text-sm mb-4">
                  Usa los botones de arriba para visualizar o descargar el PDF
                </p>
                <p className="text-xs text-slate-400">
                  💡 Para mejor experiencia, instala Adobe Reader o similar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Para iOS y otros dispositivos: iframe optimizado
  return (
    <div className="w-full h-full flex flex-col">
      {/* Barra de herramientas */}
      {isMobile && (
        <div className="flex gap-2 p-3 bg-slate-800 border-b border-slate-600">
          <div className="flex items-center gap-2 flex-1">
            {isIOS && (
              <span className="text-xs text-cyan-400 font-medium">📱 iOS</span>
            )}
            <span className="text-xs text-slate-300 truncate">{title}</span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {isIOS ? 'Safari' : 'Abrir'}
            </button>
            <button
              onClick={() => onDownload(numeroDocumento)}
              className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              {isIOS ? 'Archivos' : 'Descargar'}
            </button>
          </div>
        </div>
      )}
      
      {/* Visualizador PDF optimizado por plataforma */}
      <div className="flex-1 bg-white">
        <iframe
          src={isIOS ? 
            `${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&view=FitH&zoom=page-width` : 
            `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`
          }
          className="w-full h-full border-0"
          title={title}
          style={{ 
            minHeight: isMobile ? '500px' : '700px',
            backgroundColor: 'white'
          }}
          // Atributos específicos para iOS
          {...(isIOS && {
            allowFullScreen: true,
            webkitAllowFullScreen: true,
            mozAllowFullScreen: true
          })}
        />
      </div>
      
      {/* Footer con tips para móviles */}
      {isMobile && (
        <div className="p-2 bg-slate-900 border-t border-slate-600">
          <p className="text-xs text-slate-400 text-center">
            {isIOS ? 
              "💡 Tip: Puedes hacer zoom con pellizco en iOS" : 
              "💡 Tip: Usa los controles del PDF para navegar"
            }
          </p>
        </div>
      )}
    </div>
  );
}