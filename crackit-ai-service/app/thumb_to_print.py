import skimage.filters as skfill
import skimage.morphology as skmorph
import skimage.measure as skmeasure
import skimage.exposure as ske
import matplotlib.pyplot as plt
import numpy as np
import cv2 as cv
import heapq
import sys


def sin2d(u, v, ii, jj, N, M):
    selem = np.sin(u * ii / (2 * np.pi) + v * jj / (2 * np.pi))
    return selem * 255 / (N * M)


def high_freq_detection(imgray):
    N = 200
    M = 200

    i = np.linspace(0, N - 1, N)
    j = np.linspace(0, M - 1, M)

    jj, ii = np.meshgrid(j, i)

    filters = [
        sin2d(2, 2, ii, jj, N, M),
        sin2d(1, 2, ii, jj, N, M),
        sin2d(2, 1, ii, jj, N, M),
        sin2d(-2, 1, ii, jj, N, M),
        sin2d(-2, 2, ii, jj, N, M),
        sin2d(-2, 3, ii, jj, N, M),
    ]

    new_img = np.zeros(imgray.shape, dtype=np.float64)

    for f in filters:
        new_img += cv.filter2D(imgray, -1, f)

    return new_img


def thresh_series_mask(imgray):
    imgray_eq = ske.equalize_hist(imgray)

    median_img = skfill.median(
        imgray_eq,
        footprint=skmorph.disk(21)
    )

    block_sizes = [21, 41, 51, 61, 81]
    masks = []

    for block_size in block_sizes:

        local_thresh = skfill.threshold_local(
            median_img,
            block_size
        )

        binary_local = median_img > local_thresh

        labels = skmeasure.label(binary_local)

        high_freq_img = high_freq_detection(imgray)

        label_props = skmeasure.regionprops(labels)

        if len(label_props) == 0:
            continue

        areas = [p.area for p in label_props]

        max_areas = heapq.nlargest(
            min(15, len(areas)),
            areas
        )

        max_indices = [
            areas.index(a) + 1
            for a in max_areas
        ]

        max_i = 0
        max_count = -1

        for idx in max_indices:

            label_vals = labels == idx

            current_count = (
                    label_vals.astype(int) * high_freq_img
            ).sum()

            if current_count > max_count:
                max_count = current_count
                max_i = idx

        mask = labels == max_i
        masks.append(mask)

    if not masks:
        raise RuntimeError(
            "No valid thumb region detected."
        )

    mask = np.zeros_like(masks[0], dtype=bool)

    for m in masks:
        mask |= m

    mask = skmorph.binary_closing(
        mask,
        footprint=skmorph.disk(30)
    )

    mask = skmorph.binary_erosion(
        mask,
        footprint=skmorph.disk(10)
    )

    return mask


def extract_print(mask, imgray):
    img = imgray.copy()

    img[mask != 1] = 0

    block_size = 41

    local_thresh = skfill.threshold_local(
        img,
        block_size
    )

    binary_local = img > local_thresh

    binary_local[mask == 0] = True

    result = skfill.median(
        binary_local.astype(np.uint8),
        footprint=skmorph.disk(3)
    )

    return result


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Usage: python3 thumb_to_print.py <image>")
        sys.exit(1)

    image_path = sys.argv[1]

    imgray = cv.imread(
        image_path,
        cv.IMREAD_GRAYSCALE
    )

    if imgray is None:
        print(f"Unable to read image: {image_path}")
        sys.exit(1)

    mask = thresh_series_mask(imgray)

    f_print = extract_print(mask, imgray)

    plt.figure(figsize=(8, 8))
    plt.imshow(f_print, cmap="gray")
    plt.title("Extracted Thumbprint")
    plt.axis("off")
    plt.show()