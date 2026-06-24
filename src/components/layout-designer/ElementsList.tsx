import { useLayoutStore } from '@/store/useLayoutStore'
import type { LayoutElement, TextElement, TechnicalDescriptionElement } from '@/types/layout'
import { Map, Compass, Ruler, BookOpen, Type, Image, FileText } from 'lucide-react'

function getElementLabel(el: LayoutElement): string {
  switch (el.kind) {
    case 'mapframe': return 'Map Frame'
    case 'northarrow': return 'North Arrow'
    case 'scalebar': return 'Scale Bar'
    case 'legend': return 'Legend'
    case 'text': return (el as TextElement).text || 'Text'
    case 'logo': return 'Logo'
    case 'techdesc': return (el as TechnicalDescriptionElement).config.title || 'Technical Description'
  }
}

function KindIcon({ kind }: { kind: LayoutElement['kind'] }) {
  const cls = 'w-3.5 h-3.5 shrink-0'
  switch (kind) {
    case 'mapframe': return <Map className={cls} />
    case 'northarrow': return <Compass className={cls} />
    case 'scalebar': return <Ruler className={cls} />
    case 'legend': return <BookOpen className={cls} />
    case 'text': return <Type className={cls} />
    case 'logo': return <Image className={cls} />
    case 'techdesc': return <FileText className={cls} />
  }
}

export function ElementsList() {
  const { elements, selectedId, selectElement } = useLayoutStore()

  return (
    <div className="w-44 shrink-0 bg-white border-r border-zinc-200 flex flex-col min-w-0">
      <div className="px-3 py-2 border-b border-zinc-200 shrink-0">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Elements ({elements.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {elements.length === 0 ? (
          <p className="text-xs text-zinc-400 italic px-1.5 py-1">No elements</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {elements.map((el) => (
              <button
                key={el.id}
                onClick={() => selectElement(el.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors w-full ${
                  el.id === selectedId
                    ? 'bg-zinc-100 text-zinc-900 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800'
                }`}
              >
                <KindIcon kind={el.kind} />
                <span className="truncate flex-1">{getElementLabel(el)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
