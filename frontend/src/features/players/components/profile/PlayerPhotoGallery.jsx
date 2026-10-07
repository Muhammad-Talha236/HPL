import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

const getImageUrl = (item) => {
  if (typeof item === "string") {
    return item;
  }

  return (
    item?.image_url ||
    item?.imageUrl ||
    item?.url ||
    item?.image ||
    item?.photo ||
    null
  );
};

const getImageId = (
  item,
  index
) => {
  if (typeof item === "string") {
    return `${item}-${index}`;
  }

  return (
    item?.gallery_id ||
    item?.photo_id ||
    item?.id ||
    index
  );
};

const PlayerPhotoGallery = ({
  photos = [],
  onViewAll,
}) => {
  const [startIndex, setStartIndex] =
    useState(0);

  const validPhotos = useMemo(
    () =>
      photos.filter((item) =>
        Boolean(getImageUrl(item))
      ),
    [photos]
  );

  if (!validPhotos.length) {
    return null;
  }

  const visibleCount = 4;

  const visiblePhotos =
    validPhotos.slice(
      startIndex,
      startIndex + visibleCount
    );

  const canGoBack =
    startIndex > 0;

  const canGoForward =
    startIndex + visibleCount <
    validPhotos.length;

  const previous = () => {
    if (!canGoBack) return;

    setStartIndex((current) =>
      Math.max(0, current - 1)
    );
  };

  const next = () => {
    if (!canGoForward) return;

    setStartIndex(
      (current) => current + 1
    );
  };

  return (
    <section
      className="
        mt-5
        rounded-xl
        border
        border-[#e1e8e5]
        bg-white
        p-5
        shadow-[0_3px_14px_rgba(15,23,42,0.03)]
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <div className="flex items-center gap-2.5">
          <Images
            size={18}
            strokeWidth={1.8}
            className="text-[#07182d]"
          />

          <h2
            className="
              text-[16px]
              font-bold
              text-[#07182d]
              xl:text-[17px]
            "
          >
            Photo Gallery
          </h2>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="
              group
              inline-flex
              cursor-pointer
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1.5
              text-[10px]
              font-semibold
              text-[#078052]
              transition-colors
              hover:bg-[#edf7f3]
              xl:text-[11px]
            "
          >
            View All Photos

            <ArrowRight
              size={13}
              strokeWidth={1.8}
              className="
                transition-transform
                group-hover:translate-x-0.5
              "
            />
          </button>
        )}
      </div>

      {/* GALLERY */}

      <div className="relative mt-4">
        {/* LEFT */}

        {canGoBack && (
          <button
            type="button"
            onClick={previous}
            aria-label="Previous photos"
            className="
              absolute
              -left-3
              top-1/2
              z-20
              grid
              h-8
              w-8
              -translate-y-1/2
              cursor-pointer
              place-items-center
              rounded-full
              border
              border-[#dfe7e3]
              bg-white
              text-[#53647c]
              shadow-md
              transition-all
              hover:border-[#078052]
              hover:text-[#078052]
            "
          >
            <ChevronLeft
              size={16}
              strokeWidth={2}
            />
          </button>
        )}

        {/* IMAGES */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
            lg:grid-cols-4
          "
        >
          {visiblePhotos.map(
            (item, index) => {
              const imageUrl =
                getImageUrl(item);

              return (
                <div
                  key={getImageId(
                    item,
                    startIndex + index
                  )}
                  className="
                    group
                    relative
                    h-[120px]
                    cursor-pointer
                    overflow-hidden
                    rounded-lg
                    bg-[#eef3f1]
                    sm:h-[135px]
                    xl:h-[145px]
                  "
                >
                  <img
                    src={imageUrl}
                    alt="Player gallery"
                    loading="lazy"
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-[1.04]
                    "
                  />

                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-end
                      bg-gradient-to-t
                      from-[#07182d]/50
                      via-transparent
                      to-transparent
                      p-3
                      opacity-0
                      transition-opacity
                      duration-200
                      group-hover:opacity-100
                    "
                  >
                    <Camera
                      size={16}
                      strokeWidth={1.8}
                      className="text-white"
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* RIGHT */}

        {canGoForward && (
          <button
            type="button"
            onClick={next}
            aria-label="Next photos"
            className="
              absolute
              -right-3
              top-1/2
              z-20
              grid
              h-8
              w-8
              -translate-y-1/2
              cursor-pointer
              place-items-center
              rounded-full
              border
              border-[#dfe7e3]
              bg-white
              text-[#53647c]
              shadow-md
              transition-all
              hover:border-[#078052]
              hover:text-[#078052]
            "
          >
            <ChevronRight
              size={16}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
    </section>
  );
};

export default PlayerPhotoGallery;