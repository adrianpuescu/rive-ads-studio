import { AdsDrawer } from '../AdsDrawer'
import { BrandTokensPanel } from '../BrandTokensPanel'
import { VariantsModal } from '../VariantsModal'
import { ShareModal } from '../ShareModal'
import type { Ad } from '../../hooks/useAds'
import type { Brand } from '../../hooks/useBrandTokens'
import type { BrandTokens } from '../../types/brand-tokens'
import type { AdSpec } from '../../types/ad-spec.schema'

export interface AppOverlaysProps {
  projectsDrawerOpen: boolean
  onCloseProjects: () => void
  ads: Ad[]
  onLoadAd: (item: Ad) => void
  onRemoveAd: (id: string) => void
  onRenameAd: (id: string, newName: string) => Promise<void>
  onDuplicateAd: (id: string) => Promise<string | null>
  brandOpen: boolean
  onCloseBrands: () => void
  brands: Brand[]
  brandsLoading: boolean
  activeBrandId: string | null
  onAddBrand: (name: string, tokens: BrandTokens) => Brand
  onUpdateBrand: (id: string, updates: Partial<Brand>) => void
  onDeleteBrand: (id: string) => void
  onSetActiveBrand: (id: string | null) => void
  showVariantsModal: boolean
  onCloseVariantsModal: () => void
  variantsPrompt: string
  variants: (AdSpec | null)[]
  isGeneratingVariants: boolean
  onSelectVariant: (spec: AdSpec) => void
  onVariantSelected: (variant: AdSpec, prompt: string) => void
  onRetryVariant: (index: number) => void
  shareModalOpen: boolean
  onCloseShareModal: () => void
  shareUrl: string
  projectName: string
}

export function AppOverlays({
  projectsDrawerOpen,
  onCloseProjects,
  ads,
  onLoadAd,
  onRemoveAd,
  onRenameAd,
  onDuplicateAd,
  brandOpen,
  onCloseBrands,
  brands,
  brandsLoading,
  activeBrandId,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
  onSetActiveBrand,
  showVariantsModal,
  onCloseVariantsModal,
  variantsPrompt,
  variants,
  isGeneratingVariants,
  onSelectVariant,
  onVariantSelected,
  onRetryVariant,
  shareModalOpen,
  onCloseShareModal,
  shareUrl,
  projectName,
}: AppOverlaysProps) {
  return (
    <>
      {projectsDrawerOpen && (
        <button
          type="button"
          className="absolute inset-0 z-[19] cursor-default border-0 p-0 m-0 bg-transparent"
          onClick={onCloseProjects}
          aria-label="Close Projects"
        />
      )}
      <AdsDrawer
        isOpen={projectsDrawerOpen}
        onClose={onCloseProjects}
        items={ads}
        onLoad={onLoadAd}
        onRemove={onRemoveAd}
        onRename={onRenameAd}
        onDuplicate={onDuplicateAd}
      />
      {brandOpen && (
        <button
          type="button"
          className="absolute inset-0 z-[24] cursor-default border-0 p-0 m-0 bg-transparent"
          onClick={onCloseBrands}
          aria-label="Close Brands"
        />
      )}
      <BrandTokensPanel
        isOpen={brandOpen}
        onClose={onCloseBrands}
        brands={brands}
        isLoading={brandsLoading}
        activeBrandId={activeBrandId}
        onAddBrand={onAddBrand}
        onUpdateBrand={onUpdateBrand}
        onDeleteBrand={onDeleteBrand}
        onSetActiveBrand={onSetActiveBrand}
      />
      <VariantsModal
        isOpen={showVariantsModal}
        onClose={onCloseVariantsModal}
        prompt={variantsPrompt}
        variants={variants}
        isGenerating={isGeneratingVariants}
        onSelectVariant={onSelectVariant}
        onVariantSelected={onVariantSelected}
        onRetryVariant={onRetryVariant}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={onCloseShareModal}
        shareUrl={shareUrl}
        projectName={projectName}
      />
    </>
  )
}
