#include <FreeImage.h>

#include <cmath>

#ifdef _MSC_VER
#include <getopt.h>
#include <msc_dirent.h>
#define realpath(N, R) _fullpath((R), (N), _MAX_PATH)
#else
#include <dirent.h>
#include <unistd.h>
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#include <MaxRectsBinPack.h>
#include <ShelfBinPack.h>
#include <SkylineBinPack.h>
#include <json.h>

#include <algorithm>
#include <iterator>
#include <string>
#include <vector>

#include <errno.h>
#include <memory>

using namespace std;

#ifdef _MSC_VER
#define DIRECTORY_SEPARATOR '\\'
#else
#define DIRECTORY_SEPARATOR '/'
#endif

// options from line arguments
static int atlasWidth = 0;
static int atlasHeight = 0;
static int atlasMaxWidth = 0;
static int atlasMaxHeight = 0;
static bool atlasSizeIsCalculated = false;
static int borderWidth = 1;
static int packerType = 0;
static int packerMethod = 2;
static int sortingType = 0;
static std::string atlasFormat = "short";
static std::string path = "";
static std::string dstPath = ".";
static std::string prefixPath = "";
static bool relativeName = false;
static bool relPathFileName = false;
static bool verbose = false;
static bool extrude = false;
static bool forceSquare = false;
static bool recursive = true;
static std::string mask;
static std::string fileList;
static std::string fileListDelimiters;
static bool beauty = true;
static bool useShortNames = false;
static bool arrayFormat = false; // if true out frames list is array else it's object
static bool noAliasesByString = false;
static bool frameArrayFormat = false; // if true one frame is array else it's object
static bool storeOriginalOffset = true;
static bool npotAtlas = false;
static bool cropImages = true;

#ifdef _MSC_VER
static std::string outputDirectorySeparator = "\\";
#else
static std::string outputDirectorySeparator = "/";
#endif

#define LOGE(...)                                                                                                      \
    {                                                                                                                  \
        fflush(stdout);                                                                                                \
        fprintf(stderr, "ERROR:" __VA_ARGS__);                                                                         \
    }
#define LOGV(...)                                                                                                      \
    if (verbose)                                                                                                       \
    {                                                                                                                  \
        fflush(stderr);                                                                                                \
        fprintf(stdout, "- " __VA_ARGS__);                                                                             \
    }

//-----------------------------------------------------------------------------
// Constants.
//-----------------------------------------------------------------------------

#define DEFAULT_ATLAS_SIZE 1024
//-----------------------------------------------------------------------------
// Types.
//-----------------------------------------------------------------------------

struct FiBitmapPtr
{
    FIBITMAP *ptr;
    int *cnt;

    FiBitmapPtr(FIBITMAP *p) : ptr(p)
    {
        cnt = new int;
        *cnt = 0;
    }

    ~FiBitmapPtr()
    {
        if (*cnt == 0)
        {
            delete cnt;
            if (ptr)
                FreeImage_Unload(ptr);
        }
        else
        {
            cnt--;
        }
    }

    FiBitmapPtr(const FiBitmapPtr &v)
    {
        ptr = v.ptr;
        cnt = v.cnt;
        (*cnt)++;
    }

    FiBitmapPtr &operator=(const FiBitmapPtr &v)
    {
        if (&v == this || ptr == v.ptr)
            return *this;

        if (--(*cnt) == 0)
        {
            delete cnt;
            if (ptr)
                FreeImage_Unload(ptr);
        }

        ptr = v.ptr;
        cnt = v.cnt;
        (*cnt)++;

        return *this;
    }

    FiBitmapPtr &operator=(FIBITMAP *p)
    {
        if (p == ptr)
            return *this;

        if (--(*cnt) == 0)
        {
            delete cnt;
            if (ptr)
                FreeImage_Unload(ptr);
        }

        ptr = p;
        (*cnt)++;
        return *this;
    }

    operator FIBITMAP *() const
    {
        return ptr;
    }
};

struct MatchPathSeparator
{
    bool operator()(char ch) const
    {
        return ch == '\\' || ch == '/';
    }
};

std::string basename(std::string const &pathname)
{
    return std::string(std::find_if(pathname.rbegin(), pathname.rend(), MatchPathSeparator()).base(), pathname.end());
}

string dirname(const string &str)
{
    size_t found = str.find_last_of(DIRECTORY_SEPARATOR);
    return str.substr(0, found);
}

std::string getFileExtention(char *fn)
{
    char *sfx = strrchr(fn, '.');
    std::string fext;
    if (sfx)
    {
        sfx++;
        fext = sfx;
    }
    return fext;
}

std::string getFileExtention(const std::string &fn)
{
    return getFileExtention((char *)fn.c_str());
}

std::string removeExtension(std::string const &filename)
{
    std::string::const_reverse_iterator pivot = std::find(filename.rbegin(), filename.rend(), '.');
    return pivot == filename.rend() ? filename : std::string(filename.begin(), pivot.base() - 1);
}

struct InputImage
{
    std::string filePath;
    std::string fileName;
    std::vector<std::string> aliases;
    std::string folderName;
    std::string ext;
    std::shared_ptr<InputImage> alias;

    FiBitmapPtr bitmap;

    int bytesCount;
    int originalWidth;
    int originalHeight;
    int width;
    int height;
    int offsetX;
    int offsetY;

    int x;
    int y;
    bool rotate = false;

    bool cropImage()
    {
        int top = 0;
        int left = 0;
        int bottom = originalHeight - 1;
        int right = originalWidth - 1;

        for (; top < originalHeight; ++top)
        {
            RGBQUAD *pixel = (RGBQUAD *)FreeImage_GetScanLine(bitmap, originalHeight - top - 1);
            for (int x_ = 0; x_ < originalWidth; ++x_)
            {
                if (pixel[x_].rgbReserved > 0)
                    goto topFound;
            }
        }

        width = height = 0;
        return false;

    topFound:
        for (; bottom >= 0; --bottom)
        {
            RGBQUAD *pixel = (RGBQUAD *)FreeImage_GetScanLine(bitmap, originalHeight - bottom - 1);
            for (int x_ = 0; x_ < originalWidth; ++x_)
                if (pixel[x_].rgbReserved > 0)
                    goto bottomFound;
        }

        // картинка полностью пустая
        LOGE("cropImage: absolute empty image\n");
        width = height = offsetY = offsetX = 0;
        return false;

    bottomFound:
        for (; left < originalWidth; ++left)
            for (int y_ = 0; y_ < originalHeight; ++y_)
            {
                RGBQUAD *pixel = (RGBQUAD *)FreeImage_GetScanLine(bitmap, originalHeight - y_ - 1);
                if (pixel[left].rgbReserved > 0)
                    goto leftFound;
            }

    leftFound:
        for (; right >= 0; --right)
            for (int y_ = 0; y_ < originalHeight; ++y_)
            {
                RGBQUAD *pixel = (RGBQUAD *)FreeImage_GetScanLine(bitmap, originalHeight - y_ - 1);
                if (pixel[right].rgbReserved > 0)
                    goto rightFound;
            }

    rightFound:
        // for Cocos2d
        width = right - left + 1;
        if ((width % 2) != (originalWidth % 2))
        {
            if (left)
            {
                left -= 1;
            }
            else
            {
                right += 1;
            }
            width = right - left + 1;
        }

        height = bottom - top + 1;
        if ((height % 2) != (originalHeight % 2))
        {
            if (top)
            {
                top -= 1;
            }
            else
            {
                bottom += 1;
            }
            height = bottom - top + 1;
        }

        offsetY = top;
        offsetX = left;

        return top > 0 || left > 0 || right < originalWidth - 1 || bottom < originalHeight - 1;
    }

    void reallocBitmap()
    {
        bitmap = FreeImage_Copy(bitmap, offsetX, offsetY, offsetX + width, offsetY + height);
        originalWidth = width;
        originalHeight = height;
        offsetX = 0;
        offsetY = 0;
    }

    InputImage(int w, int h, FiBitmapPtr _bitmap)
        : bitmap(_bitmap), originalWidth(w), originalHeight(h), width(w), height(h), offsetX(0), offsetY(0), x(0), y(0),
          rotate(false)
    {
    }

    InputImage(std::string fpath, std::string fname, std::string dirName, std::string fext)
        : filePath(fpath), fileName(fname), folderName(dirName), ext(fext),
          bitmap(FreeImage_Load(FreeImage_GetFileType(fpath.c_str(), 0), fpath.c_str(), PNG_IGNOREGAMMA))
    {
        if (FreeImage_GetBPP(bitmap) != 32)
        {
            bitmap = FreeImage_ConvertTo32Bits(bitmap);
        }

        aliases.push_back(fname);
        rotate = false;
        offsetX = 0;
        offsetY = 0;
        originalWidth = width = FreeImage_GetWidth(bitmap);
        originalHeight = height = FreeImage_GetHeight(bitmap);

        LOGV("add image: \"%s\" ( %dx%d )\n", fpath.c_str(), width, height);

        bytesCount = originalHeight * FreeImage_GetPitch(bitmap);

        if (cropImages)
        {
            cropImage();
        }

        // printf ("dirname: %s \n", dirName.c_str()  );
    }
};

typedef std::shared_ptr<InputImage> InputImagePtr;
typedef std::vector<InputImagePtr> InputImageList;

inline std::string format(const char *fmt, ...)
{
    int size = 512;
    char *buffer = 0;
    buffer = new char[size];
    va_list vl;
    va_start(vl, fmt);
    int nsize = vsnprintf(buffer, size, fmt, vl);
    if (size <= nsize)
    {
        // fail delete buffer and try again
        delete buffer;
        buffer = 0;
        buffer = new char[nsize + 1]; //+1 for /0
        nsize = vsnprintf(buffer, size, fmt, vl);
    }
    std::string ret(buffer);
    va_end(vl);
    delete buffer;
    return ret;
}

bool CompareImageBySquare1(const InputImagePtr &a, const InputImagePtr &b)
{
    return a->width * a->height < b->width * b->height;
}

bool CompareImageBySquare2(const InputImagePtr &a, const InputImagePtr &b)
{
    return a->width * a->height > b->width * b->height;
}

bool CompareImageByFolderAndSquare1(const InputImagePtr &a, const InputImagePtr &b)
{
    return a->folderName == b->folderName ? a->width * a->height < b->width * b->height : a->folderName > b->folderName;
}

bool CompareImageByFolderAndSquare2(const InputImagePtr &a, const InputImagePtr &b)
{
    return a->folderName == b->folderName ? a->width * a->height < b->width * b->height : a->folderName > b->folderName;
}

bool imagesIsEqual(const InputImage &a, const InputImage &b)
{
    return a.width == b.width && a.height == b.height && a.bytesCount == b.bytesCount &&
           (memcmp(FreeImage_GetBits(a.bitmap), FreeImage_GetBits(b.bitmap), a.bytesCount) == 0);
}

int directoryCrawler(std::string dirName, InputImageList &inputImageList, std::string rootDirName,
                     bool relativeName = true, bool printError = false)
{
    struct dirent *dp;
    DIR *dirp;
    dirp = opendir(dirName.c_str());
    if (!dirp)
    {
        if (printError)
        {
            LOGE("open dir (%s)\n", dirName.c_str());
        }
        return 0;
    }

    while ((dp = readdir(dirp)))
    {
        char fullName[1024];
        sprintf(fullName, "%s%c%s", dirName.c_str(), DIRECTORY_SEPARATOR, dp->d_name);

        // fprintf (stderr, "%s (%d)\n", fullName, dp->d_type);

        switch (dp->d_type)
        {
        case DT_DIR:

            if (recursive && strcmp(dp->d_name, ".") != 0 && strcmp(dp->d_name, "..") != 0)
            {
                LOGV("processing dir %s %s\n", fullName, rootDirName.c_str());
                directoryCrawler(fullName, inputImageList, rootDirName, relativeName);
            }
            break;

        case DT_REG: {
            std::string fext = getFileExtention(dp->d_name);

            if (fext == "png" || fext == "jpg" || fext == "webp" || fext == "jpeg")
            {
                char *dnm = strrchr((char *)dirName.c_str(), DIRECTORY_SEPARATOR);
                inputImageList.push_back(std::make_shared<InputImage>(
                    fullName, relativeName ? (fullName + rootDirName.size() + 1) : dp->d_name, dnm ? dnm : dirName,
                    fext));
            }
        }
        break;

        default:
            break;
        }
    }

    closedir(dirp);
    return 1;
}

void saveStringToFile(const char *fileName, const char *data)
{
    FILE *ifile = fopen(fileName, "w+");
    if (ifile)
    {
        fprintf(ifile, "%s", data);
        fclose(ifile);
    }
}

std::string readStringFromFile(const char *fileName)
{
    const char *fullPath = realpath(fileName, NULL);

    if (fullPath && *fullPath)
    {
        FILE *ifile = fopen(fullPath, "r");
        if (ifile)
        {

            fseek(ifile, 0, SEEK_END);
            long lSize = ftell(ifile);
            rewind(ifile);

            std::string result(lSize, '\0');

            fread(&result[0], 1, lSize, ifile);

            fclose(ifile);

            if (result.empty())
            {
                LOGE("images list \"%s\": file not exist!\n", fileName);
            }

            return result;
        }
        LOGE("images list \"%s\" ( \"%s\" ): file not exist!\n", fileName, fullPath);

        return std::string();
    }

    LOGE("images list \"%s\": file not exist!\n", fileName);

    return std::string();
}

double makeAtlas(InputImageList &srcList, InputImageList &dstList, std::shared_ptr<AbstractBinPack> &packer,
                 int borderWidth)
{
    int twoBorderWidth = borderWidth * 2;

    for (InputImageList::iterator i = srcList.begin(); i != srcList.end();)
    {
        InputImage &iimg = *(*i).get();

        if (iimg.alias)
        {
            dstList.push_back(*i);
            srcList.erase(i);
            continue;
        }

        if (iimg.width == 0 || iimg.height == 0)
        { //  пустая картинка

            LOGE("makeAtlas: absolute empty image\n");

            iimg.x = 0;
            iimg.y = 0;
            iimg.rotate = false;

            dstList.push_back(*i);
            srcList.erase(i);
            continue;
        }

        LOGV("%s\n", iimg.fileName.c_str());

        Rect r = packer->Insert(iimg.width + twoBorderWidth, iimg.height + twoBorderWidth, packerMethod);

        if (r.width && r.height)
        {
            iimg.x = r.x + borderWidth;
            iimg.y = r.y + borderWidth;

            iimg.rotate = (r.width - twoBorderWidth == iimg.height);

            dstList.push_back(*i);
            srcList.erase(i);
        }
        else
        {
            i++;
        }
    }
    return packer->Occupancy();
}

void extrudeImage(FIBITMAP *bitmap, int x, int y, int width, int height, int borderWidth)
{
    if (!borderWidth)
        return;
    FIBITMAP *bm;
    // верхняя граница
    bm = FreeImage_Copy(bitmap, x, y, x + width, y + 1);
    for (int i = 0; i < borderWidth; ++i)
        FreeImage_Paste(bitmap, bm, x, y - i - 1, -1);
    FreeImage_Unload(bm);
    // нижняя граница
    bm = FreeImage_Copy(bitmap, x, y + height - 1, x + width, y + height);
    for (int i = 0; i < borderWidth; ++i)
        FreeImage_Paste(bitmap, bm, x, y + height + i, -1);
    FreeImage_Unload(bm);
    // левая граница
    bm = FreeImage_Copy(bitmap, x, y, x + 1, y + height);
    for (int i = 0; i < borderWidth; ++i)
        FreeImage_Paste(bitmap, bm, x - i - 1, y, -1);
    FreeImage_Unload(bm);
    // правая граница
    bm = FreeImage_Copy(bitmap, x + width - 1, y, x + width, y + height);
    for (int i = 0; i < borderWidth; ++i)
        FreeImage_Paste(bitmap, bm, x + width + i, y, -1);
    FreeImage_Unload(bm);
}

void saveAtlas(InputImageList &srcList, std::string filePath, std::string fileName, int width, int height,
               double occupancy)
{

    LOGV("saving atlas: %s ( %s ) %dx%d\n", filePath.c_str(), fileName.c_str(), width, height);

    FiBitmapPtr bitmap(FreeImage_Allocate(width, height, 32));
    RGBQUAD color = {0, 0, 0, 0};
    FreeImage_FillBackground(bitmap, &color, FI_COLOR_IS_RGBA_COLOR);
    Json::Value atlas;

    Json::Value framesNamesCheck;
    Json::Value framesNamesErrors;
    for (InputImageList::iterator i = srcList.begin(); i != srcList.end(); ++i)
    {
        InputImage &iimg = *(*i).get();
        if (iimg.alias)
        {
            continue;
        }

        for (int j = 0; j < (int)(iimg.aliases.size()); ++j)
        {
            std::string imageFileName = iimg.aliases[j];
            if (j == 0)
            {
                if (!framesNamesCheck[imageFileName].isUndefined())
                {
                    if (framesNamesErrors[imageFileName].size() == 0)
                        framesNamesErrors[imageFileName].add(framesNamesCheck[imageFileName]);
                    framesNamesErrors[imageFileName].add(iimg.filePath);
                }
                framesNamesCheck[imageFileName] = iimg.filePath;
            }
        }
    }

    if (!framesNamesErrors.isUndefined())
    {
        if (auto o = framesNamesErrors.asObject())
        {
            for (auto it = o->begin(); it != o->end(); it++)
            {
                LOGE("Doublicate frame names with different images (%d) for \"%s\": \n", (int)it->second.size(),
                     it->first.c_str());
                auto a = it->second.asArray();
                for (auto it2 = a->begin(); it2 != a->end(); it2++)
                {
                    fprintf(stderr, "      %s\n", it2->asString().c_str());
                }
            }
            exit(1);
        }
    }

    // fprintf (stderr, "saveAtlas: [%s][%s]\n", filePath.c_str(), fileName.c_str());
    int count = 0;
    Json::Value &frames = arrayFormat ? atlas : atlas["frames"];

    auto write = [&](InputImage &iimg, const std::string &imageFileName) {
        Json::Value &jv = arrayFormat ? frames[count++] : frames[imageFileName];

        if (iimg.alias)
        {
            iimg = *iimg.alias;
            if (!noAliasesByString)
            {
                jv = iimg.aliases.front();
                return true;
            }
        }

        int ind = 0;
        if (!frameArrayFormat)
        {
            Json::Value &rc = jv["rc"];
            rc[0] = iimg.x;
            rc[1] = iimg.y;
            rc[2] = iimg.width;
            rc[3] = iimg.height;
        }
        else
        {
            if (arrayFormat)
            {
                jv[ind++] = imageFileName;
            }
            jv[ind++] = iimg.x;
            jv[ind++] = iimg.y;
            jv[ind++] = iimg.width;
            jv[ind++] = iimg.height;
        }

        if (iimg.rotate)
        {
            if (frameArrayFormat)
            {
                jv[ind++] = 1;
            }
            else
            {
                jv["r"] = true;
            }
        }
        else
        {
            if (storeOriginalOffset && frameArrayFormat)
            {
                jv[ind++] = 0;
            }
        }

        if (storeOriginalOffset)
        {
            if (frameArrayFormat)
            {
                jv[ind++] = iimg.offsetX;
                jv[ind++] = iimg.offsetY;
                jv[ind++] = iimg.originalWidth;
                jv[ind++] = iimg.originalHeight;
            }
            else
            {
                if (iimg.offsetX || iimg.offsetY)
                {
                    jv["of"][0] = iimg.offsetX;
                    jv["of"][1] = iimg.offsetY;
                }

                if (iimg.originalWidth || iimg.originalHeight)
                {
                    jv["or"][0] = iimg.originalWidth;
                    jv["or"][1] = iimg.originalHeight;
                }
            }
        }

#ifdef DEBUG
        if (j)
        {
            jv["aliasOf"] = iimg.fileName;
        }
        else if (iimg.aliases.size() > 1)
        {
            for (int k = 1; k < (int)iimg.aliases.size(); ++k)
            {
                jv["aliases"][k - 1] = iimg.aliases[k];
            }
        }
        return false;
#else
        return true;
#endif
    };

    for (InputImagePtr &_iimg : srcList)
    {
        auto &iimg = *(_iimg.get());
        LOGV("prepare: %s\n", iimg.fileName.c_str());

        for (const auto &imageFileName : iimg.aliases)
        {
            if (write(iimg, imageFileName))
            {
                break;
            }
        }

        if (iimg.alias)
        {
            continue;
        }

        FiBitmapPtr cbm(FreeImage_Copy(iimg.bitmap, iimg.offsetX, iimg.offsetY, iimg.offsetX + iimg.width,
                                       iimg.offsetY + iimg.height));

        if (iimg.rotate)
        {
            // fprintf (
            // 	stderr,
            // 	"%s %d %d %d %d %d %d\n",
            // 	iimg.filePath.c_str(),
            // 	iimg.originalWidth,
            // 	iimg.originalHeight,
            // 	iimg.width,
            // 	iimg.height,
            // 	iimg.offsetX,
            // 	iimg.offsetY
            // 	);

            cbm = FreeImage_Rotate(cbm, -90);
        }

        if (!FreeImage_Paste(bitmap, cbm, iimg.x, iimg.y, -1))
        {
            LOGE("PASTE: %s (%dx%d), try convert to 32 bits\n", iimg.fileName.c_str(), iimg.x, iimg.y);
            cbm = FreeImage_ConvertTo32Bits(cbm);
            if (!FreeImage_Paste(bitmap, cbm, iimg.x, iimg.y, -1))
            {
                LOGE("PASTE2: %s\n", iimg.fileName.c_str());
            }
        }

        if (extrude)
        {
            int xwidth = FreeImage_GetWidth(cbm);
            int xheight = FreeImage_GetHeight(cbm);
            extrudeImage(bitmap, iimg.x, iimg.y, xwidth, xheight, borderWidth);
        }
    }

    if (npotAtlas)
    {
        InputImage tocrop(width, height, bitmap);
        if (tocrop.cropImage())
        {
            tocrop.reallocBitmap();
            bitmap = tocrop.bitmap;
            width = tocrop.width;
            height = tocrop.height;
            LOGV("cropped atlas image dimension: %dx%d\n", width, height);
        }
    }

    // TODO: check errors

    // TODO: check memory leaks!

    FreeImage_Save(FIF_PNG, bitmap, (filePath + ".png").c_str(), PNG_DEFAULT);

    if (atlasFormat == "verbose")
    {
        auto &atexture = atlas["texture"];
        atexture["width"] = width;
        atexture["height"] = height;
        if (relPathFileName)
        {
            atexture["relPathFileName"] = fileName + ".png";
        }
        else
        {
            atexture["fileName"] = fileName + ".png";
        }
        atlas["occupancy"] = occupancy;
    }

    saveStringToFile((filePath + ".json").c_str(),
                     beauty ? Json::prettyStringify(atlas).c_str() : Json::stringify(atlas).c_str());

    printf("atlas saved at: %s ( %s ) %dx%d\n", filePath.c_str(), fileName.c_str(), width, height);
}

unsigned long getPowerOfTwoGT(unsigned long v)
{
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
}

int getTotalImagesSquare(const InputImageList &imglst, int border = 0)
{
    int totalSquare = 0;
    for (auto &i : imglst)
    {
        if (!i->alias)
        {
            totalSquare += (i->width + border) * (i->height + border);
        }
    }
    return totalSquare;
}

void calculateAtlasDimension(int &width, int &height, const InputImageList &imglst, int border)
{
    // вычисляем общую площадь картинок с учётом полей
    int totalSquare = getTotalImagesSquare(imglst, border);
    int maxMin = 0;
    int maxMax = 0;
    border *= 2;
    for (auto &i : imglst)
    {
        if (!i->alias)
        {
            int w = (i->width + border);
            int h = (i->height + border);
            maxMin = max(maxMin, min(w, h));
            maxMax = max(maxMax, max(w, h));
        }
    }

    printf("Total square: %d, maxMax: %d, maxMin: %d\n", totalSquare, maxMax, maxMin);

    int aw = getPowerOfTwoGT(maxMax);
    int ah = getPowerOfTwoGT(maxMin);

    // размеры заданы, считать не нужно
    // главное, чтобы минимальный из заданных размеров
    // был больше или равный maxMin

    if (width && height)
    {
        if (atlasMaxWidth > 0)
        {
            maxMax = min(max(atlasMaxWidth, atlasMaxHeight), maxMax);
        }

        if (atlasMaxHeight > 0)
        {
            maxMin = min(max(atlasMaxWidth, atlasMaxHeight), maxMin);
        }

        if ((max(width, height) < maxMax) || (min(width, height) < maxMin))
        {
            LOGE("Wrong atlas size. Recommended atlas dimensions %dx%d\n", aw, ah);
            exit(1);
        }

        printf("Specified atlas dimension: %dx%d\n", width, height);
        return;
    }

    if (imglst.size() == 1)
    {
        width = aw;
        height = ah;
        return;
    }

    double squareWithReserveOf15Percent = totalSquare * 1.25;

    if (width == 0 && height == 0) // нужно вычислить оба размера
    {
        atlasSizeIsCalculated = true;
        // printf ("default %dx%d\n", *width, *height);
        int i = max((int)log2(aw), 1);
        int j = max((int)log2(ah), 1);

        for (; i < 15 && j < 15; ++i, ++j)
        {
            if (atlasMaxWidth > 0 && aw > atlasMaxWidth)
            {
                aw = atlasMaxWidth;
            }

            if (atlasMaxHeight > 0 && ah > atlasMaxHeight)
            {
                ah = atlasMaxHeight;
            }

            if (aw == atlasMaxWidth && ah == atlasMaxHeight)
            {
                break;
            }

            if ((aw * ah) > squareWithReserveOf15Percent)
            {
                if (!forceSquare)
                {
                    while ((aw * (ah / 2)) > squareWithReserveOf15Percent)
                    {
                        ah >>= 1;
                    }
                }
                break;
            }
            aw <<= 1;
            ah <<= 1;
        }

        // aw = atlasMaxWidth > 0 ? min(atlasMaxWidth, aw << 1) : aw << 1;
        // ah = atlasMaxHeight > 0 ? min(atlasMaxHeight, ah << 1) : ah << 1;

        printf("Calculated atlas dimension: %dx%d\n", aw, ah);
        width = aw;
        height = ah;
        return;
    }

    if (width == 0)
    {
        ah = height;
        int i = max((int)log2(aw), 1);

        for (; i < 15; ++i)
        {
            if (atlasMaxWidth > 0 && aw > atlasMaxWidth)
            {
                aw = atlasMaxWidth;
                break;
            }

            if ((aw * ah) > squareWithReserveOf15Percent)
            {
                if (!forceSquare)
                {
                    while ((ah * (aw / 2)) > squareWithReserveOf15Percent)
                    {
                        aw >>= 1;
                    }
                }
                break;
            }
            aw <<= 1;
        }

        aw = atlasMaxWidth > 0 ? min(atlasMaxWidth, aw << 1) : aw << 1;

        printf("Calculated atlas dimension: %dx%d\n", aw, ah);
        width = aw;
        return;
    }

    if (height == 0)
    {
        aw = atlasWidth;
        int j = max((int)log2(ah), 1);

        for (; j < 15; ++j)
        {
            if (atlasMaxHeight > 0 && ah > atlasMaxHeight)
            {
                ah = atlasMaxHeight;
                break;
            }

            if ((aw * ah) > squareWithReserveOf15Percent)
            {
                if (!forceSquare)
                {
                    while ((aw * (ah / 2)) > squareWithReserveOf15Percent)
                    {
                        ah >>= 1;
                    }
                }
                break;
            }
            ah <<= 1;
        }

        ah = atlasMaxHeight > 0 ? min(atlasMaxHeight, ah << 1) : ah << 1;

        printf("Calculated atlas dimension: %dx%d\n", aw, ah);
        height = ah;
        return;
    }

    LOGE("Undefined behaviour. Recommended atlas dimensions %dx%d\n", aw, ah);
    exit(1);
}

template <class ContainerT>
void tokenize(const std::string &str, ContainerT &tokens, const std::string &delimiters = " ", bool trimEmpty = false)
{
    std::string::size_type pos, lastPos = 0, length = str.length();

    using value_type = typename ContainerT::value_type;
    using size_type = typename ContainerT::size_type;

    while (lastPos < length + 1)
    {
        pos = str.find_first_of(delimiters, lastPos);
        if (pos == std::string::npos)
        {
            pos = length;
        }

        if (pos != lastPos || !trimEmpty)
            tokens.push_back(value_type(str.data() + lastPos, (size_type)pos - lastPos));

        lastPos = pos + 1;
    }
}

AbstractBinPack *createPacker(int type, int w, int h)
{

    switch (type)
    {
    case 1:
        return new ShelfBinPack(w, h, false);
    case 2:
        return new ShelfBinPack(w, h, true);
    case 3:
        return new SkylineBinPack(w, h, false);
    case 4:
        return new SkylineBinPack(w, h, true);
    }
    return new MaxRectsBinPack(w, h);
}

int main(int argc, char *argv[])
{
    int c;
    opterr = 0;

    while ((c = getopt(argc, argv, "vaAxrfqRD2cw:h:b:s:d:m:p:l:L:g:n:u:S:W:H:")) != -1)
        switch (c)
        {
        case '?':
            LOGE("Option -%c requires an argument.\n", optopt);
            return 1;
        case 'c':
            cropImages = false;
            break;
        case '2':
            npotAtlas = true;
            break;
        case 'a':
            arrayFormat = true;
            break;
        case 'A':
            noAliasesByString = true;
            break;
        case 'b':
            borderWidth = atoi(optarg);
            break;
        case 'd':
            dstPath = optarg;
            prefixPath = dstPath;
            break;
        case 'D':
            relPathFileName = true;
            break;
        case 'g': // result atlas format
            if (optarg)
            {
                atlasFormat = optarg;

                if (atlasFormat == "shortWithOffset")
                {
                    beauty = false;
                    frameArrayFormat = true;
                    storeOriginalOffset = true;
                    useShortNames = true;
                }
                else if (atlasFormat == "short")
                {
                    beauty = false;
                    frameArrayFormat = true;
                    storeOriginalOffset = false;
                    useShortNames = true;
                }
                else
                {
                    opterr = 1;
                }
            }
            break;
        case 'l':
            fileList = optarg;
            break;
        case 'L':
            // TODO: free char*?
            fileList = readStringFromFile((char *)optarg);
            if (fileList.empty())
            {
                exit(1);
            }
            break;
        case 'm':
            mask = optarg;
            break;
        case 'n':
            packerType = atoi(optarg);
            break;
        case 'p':
            prefixPath = optarg;
            break;
        case 'r':
            relativeName = true;
            break;
        case 'R':
            recursive = false;
            break;
        case 's':
            path = optarg;
            break;
        case 'S':
            if (optarg && *optarg)
                outputDirectorySeparator = optarg;
            break;
        case 'f':
            forceSquare = true;
            break;
        case 'u':
            packerMethod = atoi(optarg);
            break;
        case 'v':
            verbose = true;
            break;
        case 'h':
            atlasHeight = max(0, atoi(optarg));
            break;
        case 'w':
            atlasWidth = max(0, atoi(optarg));
            break;
        case 'W':
            atlasMaxWidth = max(0, atoi(optarg));
            break;
        case 'H':
            atlasMaxHeight = max(0, atoi(optarg));
            break;
        case 'x':
            extrude = true;
            break;
        default:
            opterr = 1;
        }

    if (relPathFileName)
    {
        prefixPath = "";
    }

    /*
    if (!atlasWidth)
    {
        atlasWidth = DEFAULT_ATLAS_SIZE;
    }

    if (!atlasHeight)
    {
        atlasHeight = DEFAULT_ATLAS_SIZE;
    }
    */

    // надо бы освобождать результат realpath
    const char *rp = path.empty() ? "" : realpath(path.c_str(), NULL);
    const char *drp = dstPath.empty() ? "" : realpath(dstPath.c_str(), NULL);

    dstPath = drp ? drp : "";
    path = rp ? rp : "";

    if (atlasMaxWidth > 0 && atlasWidth > 0)
        atlasWidth = min(atlasWidth, atlasMaxWidth);
    if (atlasMaxHeight > 0 && atlasHeight > 0)
        atlasHeight = min(atlasHeight, atlasMaxHeight);

    if ((opterr > 0) || (path.empty() && fileList.empty()) || dstPath.empty())
    {
        fprintf(stderr,
                R"(
TexturePacker - a program for prepare atlas of images.
usage: 
TexturePacker [OPTIONS] -d <dest dir> -s <source dir> 
TexturePacker [OPTIONS] -d <dest dir> -l "file1.png" "file2.png" etc ...

OPTIONS:
    a - array json format ( for short )
    A - no aliases by string
    b - width of border between images in atlas
    c - do not crop images
    d - destination. Directory for the result files
    D - relPathFileName - use relative texture filename instead of fileName (full dir)
    f - force square atlas
    g - atlas format ( verbose / short / shortWithOffset )
    J - do not save json
    l - file list sources (in quotes, split by file list delimiter)
    F - file list delimiter character ( \\n by default )
    L - file list sources file (split by file list delimiter)
    m - name mask. Used to construct the names of the atlas files (.png .json) as the first argument
        to function printf, where the second argument is integer sequence number
        of the atlas. For example: atlas_%%03d
    n - packer type (int 0, 1, 2, 3, 4)
    p - prefix for atlas fileName in json files (default: destination path)
    r - relative name flag. If set, to the name the picture in the file
        description adds the path relative to the root directory.
    R - disable recursive source directory reading
    s - source. Root directory with images and possibly subdirectories.
    S - output path separator
    u - packer method (int 0, 1, 2, 3, 4)
    v - verbose
    h - atlas height
    H - atlas max height (if no height)
    w - atlas width 
    W - atlas max width (if no width)
    x - extrude flag    
)");

        if (path.empty() && fileList.empty())
        {
            LOGE("src path is empty\n");
        }
        if (dstPath.empty())
        {
            LOGE("dst path is empty\n");
        }

        return 1;
    }

    FreeImage_Initialise(false);

    if (mask.empty())
    {
        if (path.empty())
        {
            mask = "atlas_%03d";
        }
        else
        {
            char *dn = strrchr((char *)path.c_str(), DIRECTORY_SEPARATOR);
            mask = dn ? dn + 1 : path;
            mask += "_%03d";
        }
    }

    InputImageList inputImageList;
    std::vector<std::string> realFilesList;

    if (!path.empty())
    {
        directoryCrawler(path, inputImageList, path, relativeName);
    }
    else
    {
        LOGV("fileList:\n%s\n", fileList.c_str());

        if (fileListDelimiters.empty())
        {
            fileListDelimiters = "\n";
        }

        tokenize(fileList, realFilesList, fileListDelimiters, true);

        for (std::string fn : realFilesList)
        {

            if (!directoryCrawler(fn, inputImageList, fn, relativeName, false))
            {
                // not a directory
                struct stat st;
                // if path exist

                char *c_fn = (char *)fn.c_str();
                char *rp = realpath(c_fn, NULL);
                std::string fullName = "";
                if (rp)
                {
                    fullName = rp;
                    int err = stat(c_fn, &st);
                    if (err == 0)
                    {
                        // printf("process %s\n", c_fn);
                        // if file
                        if (S_ISREG(st.st_mode))
                        {
                            std::string fext = getFileExtention(fn);

                            if (fext == "png" || fext == "jpg" || fext == "webp" || fext == "jpeg")
                            {

                                char *char_fn = (char *)fn.c_str();

                                if (useShortNames)
                                {
                                    if (relativeName)
                                    {
                                        fn = removeExtension(fn);
                                    }
                                    else
                                    {
                                        fn = removeExtension(basename(char_fn));
                                    }
                                }

                                LOGV("push image: \"%s\" -> \"%s\" \n", fullName.c_str(), fn.c_str());

                                // fullName
                                inputImageList.push_back(std::make_shared<InputImage>(fullName, fn, dirname(rp), fext));
                            }
                        }
                    }
                    else
                    {
                        LOGE("no file \"%s\" err: %d : %s\n", rp, errno, strerror(errno));
                    }
                }
                else
                {
                    LOGE("no real path to \"%s\"\n", c_fn);
                }
            }
        }
    }

    // сортируем
    // TODO: different sortingTypes?
    switch (sortingType)
    {

    default:
        std::sort(inputImageList.begin(), inputImageList.end(), CompareImageByFolderAndSquare1);
    }

    // убираем одинаковые изображения и формируем список алиасов
    for (InputImageList::iterator i = inputImageList.begin(); i != inputImageList.end(); ++i)
    {
        InputImage &a = *(*i).get();
        for (InputImageList::iterator j = i + 1; j != inputImageList.end();)
        {
            InputImage &b = *(*j).get();
            if (imagesIsEqual(a, b))
            {
                a.aliases.push_back(b.fileName);
                b.alias = *i;
                // inputImageList.erase(j);
                j++;
            }
            else
            {
                j++;
            }
        }
    }

    // вычисляем оптимальный размер атласа
    calculateAtlasDimension(atlasWidth, atlasHeight, inputImageList, borderWidth);

    int atlasNumber = 0;
    while (inputImageList.size())
    {
        int currentAtlasWidth = atlasWidth;
        int currentAtlasHeight = atlasHeight;

        auto save = [&](InputImageList &dstImageList, float occupancy) {
            if (dstImageList.size())
            {
                if (atlasSizeIsCalculated && atlasMaxHeight == 0 && atlasMaxWidth == 0 && atlasNumber > 0)
                {
                    LOGE("Undefined behaviour. More than one atlas! Other Images:\n", atlasNumber);
                    for (InputImagePtr &i : dstImageList)
                    {
                        fprintf(stderr, "%s, ", i->fileName.c_str());
                    }
                    exit(1);
                    return;
                }

                std::string atlasFileName = format(mask.c_str(), atlasNumber);
                std::string atlasFilePath =
                    !dstPath.empty() ? dstPath + outputDirectorySeparator + atlasFileName : atlasFileName;
                std::string atlasFilePath2 =
                    !prefixPath.empty() ? prefixPath + outputDirectorySeparator + atlasFileName : atlasFileName;

                if (atlasSizeIsCalculated && atlasNumber > 0)
                {
                    currentAtlasWidth = 0;
                    currentAtlasHeight = 0;
                    calculateAtlasDimension(currentAtlasWidth, currentAtlasHeight, dstImageList, borderWidth);
                }

                saveAtlas(dstImageList, atlasFilePath, atlasFilePath2, currentAtlasWidth, currentAtlasHeight,
                          occupancy);

                atlasNumber++;
            }
        };

        int step = 0;

        while (1)
        {
            InputImageList dstImageList;
            std::shared_ptr<AbstractBinPack> packer(createPacker(packerType, currentAtlasWidth, currentAtlasHeight));

            double occupancy = makeAtlas(inputImageList, dstImageList, packer, borderWidth);

            if (inputImageList.size() == 0 ||
                (!atlasSizeIsCalculated &&
                 ((currentAtlasWidth == atlasWidth) && (currentAtlasHeight == atlasHeight))) ||
                ((currentAtlasWidth == atlasMaxWidth) && (currentAtlasHeight == atlasMaxHeight)))
            {
                save(dstImageList, occupancy);
                break;
            }
            else
            {
                // auto grow atlas size
                if ((step++ % 2) == 0)
                {
                    currentAtlasWidth *= 2;
                    if (!atlasSizeIsCalculated && currentAtlasWidth > atlasWidth)
                    {
                        currentAtlasWidth = atlasWidth;
                    }

                    if (atlasMaxWidth > 0)
                    {
                        currentAtlasWidth = min(atlasMaxWidth, currentAtlasWidth);
                    }
                }
                else
                {
                    currentAtlasHeight *= 2;
                    if (!atlasSizeIsCalculated && currentAtlasHeight > atlasHeight)
                    {
                        currentAtlasHeight = atlasHeight;
                    }

                    if (atlasMaxHeight > 0)
                    {
                        currentAtlasHeight = min(atlasMaxHeight, currentAtlasHeight);
                    }
                }

                for (InputImageList::iterator i = dstImageList.begin(); i != dstImageList.end(); ++i)
                {
                    inputImageList.push_back(*i);
                }
            }
        }
    }

    FreeImage_DeInitialise();
    return 0;
}
