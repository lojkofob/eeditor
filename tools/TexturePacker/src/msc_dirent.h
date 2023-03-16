/*
 * Dirent interface for Microsoft Visual Studio
 *
 * Copyright (C) 1998-2019 Toni Ronkko
 * This file is part of dirent.  Dirent may be freely distributed
 * under the MIT license.  For all details and documentation, see
 * https://github.com/tronkko/dirent
 */
#ifndef DIRENT_H
#define DIRENT_H

#ifndef MAX_PATH
#define MAX_PATH 1024
#endif // !MAX_PATH

#if defined(__clang__)
#	pragma clang diagnostic ignored "-Wunused-function"
#elif defined(_MSC_VER)
#	pragma warning(disable:4505) // error C4505: '_wreaddir': unreferenced local function has been removed
#else
#	pragma GCC diagnostic ignored "-Wunused-function"
#endif // _MSC_VER

 /*
  * Include windows.h without Windows Sockets 1.1 to prevent conflicts with
  * Windows Sockets 2.0.
  */
#ifndef WIN32_LEAN_AND_MEAN
#   define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <winerror.h>

#include <stringapiset.h>


#include <stdio.h>
#include <stdarg.h>
#include <wchar.h>
#include <string.h>
#include <stdlib.h>
#include <malloc.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>


#define FILE_SHARE_READ                 0x00000001  
#define FILE_SHARE_WRITE                0x00000002  
#define FILE_SHARE_DELETE               0x00000004  
#define FILE_ATTRIBUTE_READONLY             0x00000001  
#define FILE_ATTRIBUTE_HIDDEN               0x00000002  
#define FILE_ATTRIBUTE_SYSTEM               0x00000004  
#define FILE_ATTRIBUTE_DIRECTORY            0x00000010  
#define FILE_ATTRIBUTE_ARCHIVE              0x00000020  
#define FILE_ATTRIBUTE_DEVICE               0x00000040  
#define FILE_ATTRIBUTE_NORMAL               0x00000080  
#define FILE_ATTRIBUTE_TEMPORARY            0x00000100  
#define FILE_ATTRIBUTE_SPARSE_FILE          0x00000200  
#define FILE_ATTRIBUTE_REPARSE_POINT        0x00000400  
#define FILE_ATTRIBUTE_COMPRESSED           0x00000800  
#define FILE_ATTRIBUTE_OFFLINE              0x00001000  
#define FILE_ATTRIBUTE_NOT_CONTENT_INDEXED  0x00002000  
#define FILE_ATTRIBUTE_ENCRYPTED            0x00004000  
#define FILE_ATTRIBUTE_INTEGRITY_STREAM     0x00008000  
#define FILE_ATTRIBUTE_VIRTUAL              0x00010000  
#define FILE_ATTRIBUTE_NO_SCRUB_DATA        0x00020000  
#define FILE_ATTRIBUTE_EA                   0x00040000  
#define FILE_ATTRIBUTE_PINNED               0x00080000  
#define FILE_ATTRIBUTE_UNPINNED             0x00100000  
#define FILE_ATTRIBUTE_RECALL_ON_OPEN       0x00040000  
#define FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS 0x00400000 
#define TREE_CONNECT_ATTRIBUTE_PRIVACY      0x00004000  
#define TREE_CONNECT_ATTRIBUTE_INTEGRITY    0x00008000  
#define TREE_CONNECT_ATTRIBUTE_GLOBAL       0x00000004  
#define TREE_CONNECT_ATTRIBUTE_PINNED       0x00000002  
#define FILE_ATTRIBUTE_STRICTLY_SEQUENTIAL  0x20000000  
#define FILE_NOTIFY_CHANGE_FILE_NAME    0x00000001   
#define FILE_NOTIFY_CHANGE_DIR_NAME     0x00000002   
#define FILE_NOTIFY_CHANGE_ATTRIBUTES   0x00000004   
#define FILE_NOTIFY_CHANGE_SIZE         0x00000008   
#define FILE_NOTIFY_CHANGE_LAST_WRITE   0x00000010   
#define FILE_NOTIFY_CHANGE_LAST_ACCESS  0x00000020   
#define FILE_NOTIFY_CHANGE_CREATION     0x00000040   
#define FILE_NOTIFY_CHANGE_SECURITY     0x00000100   
#define FILE_ACTION_ADDED                   0x00000001   
#define FILE_ACTION_REMOVED                 0x00000002   
#define FILE_ACTION_MODIFIED                0x00000003   
#define FILE_ACTION_RENAMED_OLD_NAME        0x00000004   
#define FILE_ACTION_RENAMED_NEW_NAME        0x00000005   
#define MAILSLOT_NO_MESSAGE             ((DWORD)-1) 
#define MAILSLOT_WAIT_FOREVER           ((DWORD)-1) 
#define FILE_CASE_SENSITIVE_SEARCH          0x00000001  
#define FILE_CASE_PRESERVED_NAMES           0x00000002  
#define FILE_UNICODE_ON_DISK                0x00000004  
#define FILE_PERSISTENT_ACLS                0x00000008  
#define FILE_FILE_COMPRESSION               0x00000010  
#define FILE_VOLUME_QUOTAS                  0x00000020  
#define FILE_SUPPORTS_SPARSE_FILES          0x00000040  
#define FILE_SUPPORTS_REPARSE_POINTS        0x00000080  
#define FILE_SUPPORTS_REMOTE_STORAGE        0x00000100  
#define FILE_RETURNS_CLEANUP_RESULT_INFO    0x00000200  
#define FILE_SUPPORTS_POSIX_UNLINK_RENAME   0x00000400  




#define FILE_VOLUME_IS_COMPRESSED           0x00008000  
#define FILE_SUPPORTS_OBJECT_IDS            0x00010000  
#define FILE_SUPPORTS_ENCRYPTION            0x00020000  
#define FILE_NAMED_STREAMS                  0x00040000  
#define FILE_READ_ONLY_VOLUME               0x00080000  
#define FILE_SEQUENTIAL_WRITE_ONCE          0x00100000  
#define FILE_SUPPORTS_TRANSACTIONS          0x00200000  
#define FILE_SUPPORTS_HARD_LINKS            0x00400000  
#define FILE_SUPPORTS_EXTENDED_ATTRIBUTES   0x00800000  
#define FILE_SUPPORTS_OPEN_BY_FILE_ID       0x01000000  
#define FILE_SUPPORTS_USN_JOURNAL           0x02000000  
#define FILE_SUPPORTS_INTEGRITY_STREAMS     0x04000000  
#define FILE_SUPPORTS_BLOCK_REFCOUNTING     0x08000000  
#define FILE_SUPPORTS_SPARSE_VDL            0x10000000  
#define FILE_DAX_VOLUME                     0x20000000  
#define FILE_SUPPORTS_GHOSTING              0x40000000  

#define FILE_INVALID_FILE_ID               ((LONGLONG)-1LL) 

#if defined(_WIN64)
typedef __int64 INT_PTR, * PINT_PTR;
typedef unsigned __int64 UINT_PTR, * PUINT_PTR;

typedef __int64 LONG_PTR, * PLONG_PTR;
typedef unsigned __int64 ULONG_PTR, * PULONG_PTR;

#define __int3264   __int64

#else
typedef _W64 int INT_PTR, * PINT_PTR;
typedef _W64 unsigned int UINT_PTR, * PUINT_PTR;

typedef _W64 long LONG_PTR, * PLONG_PTR;
typedef _W64 unsigned long ULONG_PTR, * PULONG_PTR;

#define __int3264   __int32

#endif

typedef void* HANDLE;
#define INVALID_HANDLE_VALUE ((HANDLE)(LONG_PTR)-1)

typedef wchar_t WCHAR;    // wc,   16-bit UNICODE character
/*
typedef struct _FILETIME {
    DWORD dwLowDateTime;
    DWORD dwHighDateTime;
} FILETIME, * PFILETIME, * LPFILETIME;

typedef struct _WIN32_FIND_DATAW {
    DWORD dwFileAttributes;
    FILETIME ftCreationTime;
    FILETIME ftLastAccessTime;
    FILETIME ftLastWriteTime;
    DWORD nFileSizeHigh;
    DWORD nFileSizeLow;
    DWORD dwReserved0;
    DWORD dwReserved1;
    _Field_z_ WCHAR  cFileName[MAX_PATH];
    _Field_z_ WCHAR  cAlternateFileName[14];
#ifdef _MAC
    DWORD dwFileType;
    DWORD dwCreatorType;
    WORD  wFinderFlags;
#endif
} WIN32_FIND_DATAW, * PWIN32_FIND_DATAW, * LPWIN32_FIND_DATAW;
*/

/* Indicates that d_type field is available in dirent structure */
#define _DIRENT_HAVE_D_TYPE

/* Indicates that d_namlen field is available in dirent structure */
#define _DIRENT_HAVE_D_NAMLEN

/* Entries missing from MSVC 6.0 */
#if !defined(FILE_ATTRIBUTE_DEVICE)
#   define FILE_ATTRIBUTE_DEVICE 0x40
#endif

/* File type and permission flags for stat(), general mask */
#if !defined(S_IFMT)
#   define S_IFMT _S_IFMT
#endif

/* Directory bit */
#if !defined(S_IFDIR)
#   define S_IFDIR _S_IFDIR
#endif

/* Character device bit */
#if !defined(S_IFCHR)
#   define S_IFCHR _S_IFCHR
#endif

/* Pipe bit */
#if !defined(S_IFFIFO)
#   define S_IFFIFO _S_IFFIFO
#endif

/* Regular file bit */
#if !defined(S_IFREG)
#   define S_IFREG _S_IFREG
#endif

/* Read permission */
#if !defined(S_IREAD)
#   define S_IREAD _S_IREAD
#endif

/* Write permission */
#if !defined(S_IWRITE)
#   define S_IWRITE _S_IWRITE
#endif

/* Execute permission */
#if !defined(S_IEXEC)
#   define S_IEXEC _S_IEXEC
#endif

/* Pipe */
#if !defined(S_IFIFO)
#   define S_IFIFO _S_IFIFO
#endif

/* Block device */
#if !defined(S_IFBLK)
#   define S_IFBLK 0
#endif

/* Link */
#if !defined(S_IFLNK)
#   define S_IFLNK 0
#endif

/* Socket */
#if !defined(S_IFSOCK)
#   define S_IFSOCK 0
#endif

/* Read user permission */
#if !defined(S_IRUSR)
#   define S_IRUSR S_IREAD
#endif

/* Write user permission */
#if !defined(S_IWUSR)
#   define S_IWUSR S_IWRITE
#endif

/* Execute user permission */
#if !defined(S_IXUSR)
#   define S_IXUSR 0
#endif

/* Read group permission */
#if !defined(S_IRGRP)
#   define S_IRGRP 0
#endif

/* Write group permission */
#if !defined(S_IWGRP)
#   define S_IWGRP 0
#endif

/* Execute group permission */
#if !defined(S_IXGRP)
#   define S_IXGRP 0
#endif

/* Read others permission */
#if !defined(S_IROTH)
#   define S_IROTH 0
#endif

/* Write others permission */
#if !defined(S_IWOTH)
#   define S_IWOTH 0
#endif

/* Execute others permission */
#if !defined(S_IXOTH)
#   define S_IXOTH 0
#endif

/* Maximum length of file name */
#if !defined(PATH_MAX)
#   define PATH_MAX MAX_PATH
#endif
#if !defined(FILENAME_MAX)
#   define FILENAME_MAX MAX_PATH
#endif
#if !defined(NAME_MAX)
#   define NAME_MAX FILENAME_MAX
#endif

/* File type flags for d_type */
#define DT_UNKNOWN 0
#define DT_REG S_IFREG
#define DT_DIR S_IFDIR
#define DT_FIFO S_IFIFO
#define DT_SOCK S_IFSOCK
#define DT_CHR S_IFCHR
#define DT_BLK S_IFBLK
#define DT_LNK S_IFLNK

/* Macros for converting between st_mode and d_type */
#define IFTODT(mode) ((mode) & S_IFMT)
#define DTTOIF(type) (type)

/*
 * File type macros.  Note that block devices, sockets and links cannot be
 * distinguished on Windows and the macros S_ISBLK, S_ISSOCK and S_ISLNK are
 * only defined for compatibility.  These macros should always return false
 * on Windows.
 */
#if !defined(S_ISFIFO)
#   define S_ISFIFO(mode) (((mode) & S_IFMT) == S_IFIFO)
#endif
#if !defined(S_ISDIR)
#   define S_ISDIR(mode) (((mode) & S_IFMT) == S_IFDIR)
#endif
#if !defined(S_ISREG)
#   define S_ISREG(mode) (((mode) & S_IFMT) == S_IFREG)
#endif
#if !defined(S_ISLNK)
#   define S_ISLNK(mode) (((mode) & S_IFMT) == S_IFLNK)
#endif
#if !defined(S_ISSOCK)
#   define S_ISSOCK(mode) (((mode) & S_IFMT) == S_IFSOCK)
#endif
#if !defined(S_ISCHR)
#   define S_ISCHR(mode) (((mode) & S_IFMT) == S_IFCHR)
#endif
#if !defined(S_ISBLK)
#   define S_ISBLK(mode) (((mode) & S_IFMT) == S_IFBLK)
#endif

 /* Return the exact length of the file name without zero terminator */
#define _D_EXACT_NAMLEN(p) ((p)->d_namlen)

/* Return the maximum size of a file name */
#define _D_ALLOC_NAMLEN(p) ((PATH_MAX)+1)


#ifdef __cplusplus
extern "C" {
#endif


    /* Wide-character version */
    struct _wdirent {
        /* Always zero */
        long d_ino;

        /* File position within stream */
        long d_off;

        /* Structure size */
        unsigned short d_reclen;

        /* Length of name without \0 */
        size_t d_namlen;

        /* File type */
        int d_type;

        /* File name */
        wchar_t d_name[PATH_MAX + 1];
    };
    typedef struct _wdirent _wdirent;

    struct _WDIR {
        /* Current directory entry */
        struct _wdirent ent;

        /* Private file data */
        WIN32_FIND_DATAW data;

        /* True if data is valid */
        int cached;

        /* Win32 search handle */
        void* handle;

        /* Initial directory name */
        wchar_t* patt;
    };
    typedef struct _WDIR _WDIR;

    /* Multi-byte character version */
    struct dirent {
        /* Always zero */
        long d_ino;

        /* File position within stream */
        long d_off;

        /* Structure size */
        unsigned short d_reclen;

        /* Length of name without \0 */
        size_t d_namlen;

        /* File type */
        int d_type;

        /* File name */
        char d_name[PATH_MAX + 1];
    };
    typedef struct dirent dirent;

    struct DIR {
        struct dirent ent;
        struct _WDIR* wdirp;
    };
    typedef struct DIR DIR;


    /* Dirent functions */
    static DIR* opendir(const char* dirname);
    static _WDIR* _wopendir(const wchar_t* dirname);

    static struct dirent* readdir(DIR* dirp);
    static struct _wdirent* _wreaddir(_WDIR* dirp);

    static int readdir_r(
        DIR* dirp, struct dirent* entry, struct dirent** result);
    static int _wreaddir_r(
        _WDIR* dirp, struct _wdirent* entry, struct _wdirent** result);

    static int closedir(DIR* dirp);
    static int _wclosedir(_WDIR* dirp);

    static void rewinddir(DIR* dirp);
    static void _wrewinddir(_WDIR* dirp);

    static int scandir(const char* dirname, struct dirent*** namelist,
        int (*filter)(const struct dirent*),
        int (*compare)(const struct dirent**, const struct dirent**));

    static int alphasort(const struct dirent** a, const struct dirent** b);

    static int versionsort(const struct dirent** a, const struct dirent** b);

    typedef WCHAR* LPWSTR;
    typedef _Null_terminated_ const WCHAR* LPCWSTR, * PCWSTR;

#define WINBASEAPI __declspec(dllimport)
#define WINAPI __stdcall

    WINBASEAPI
        _Success_(return != 0 && return < nBufferLength)
        DWORD
        WINAPI
        GetFullPathNameW(
            _In_ LPCWSTR lpFileName,
            _In_ DWORD nBufferLength,
            _Out_writes_to_opt_(nBufferLength, return +1) LPWSTR lpBuffer,
            _Outptr_opt_ LPWSTR* lpFilePart
        );


    WINBASEAPI
        bool
        WINAPI
        FindClose(
            _Inout_ HANDLE hFindFile
        );


    /*
    typedef enum _FINDEX_INFO_LEVELS {
        FindExInfoStandard,
        FindExInfoBasic,
        FindExInfoMaxInfoLevel
    } FINDEX_INFO_LEVELS;

#define FIND_FIRST_EX_CASE_SENSITIVE        0x00000001
#define FIND_FIRST_EX_LARGE_FETCH           0x00000002
#define FIND_FIRST_EX_ON_DISK_ENTRIES_ONLY  0x00000004


    typedef int                 INT;
    typedef unsigned int        UINT;
    typedef unsigned int* PUINT;
    typedef bool BOOL;

    typedef enum _FINDEX_SEARCH_OPS {
        FindExSearchNameMatch,
        FindExSearchLimitToDirectories,
        FindExSearchLimitToDevices,
        FindExSearchMaxSearchOp
    } FINDEX_SEARCH_OPS;


#ifndef VOID
#define VOID void
    typedef char CHAR;
    typedef short SHORT;
    typedef long LONG;
#if !defined(MIDL_PASS)
    typedef int INT;
#endif
#endif */


    WINBASEAPI
        _Check_return_
        _Post_equals_last_error_
        DWORD
        WINAPI
        GetLastError(
            VOID
        );


    WINBASEAPI
        UINT
        WINAPI
        GetOEMCP(void);

    WINBASEAPI
        UINT
        WINAPI
        GetACP(void);


    WINBASEAPI
        BOOL
        WINAPI
        FindNextFileW(
            _In_ HANDLE hFindFile,
            _Out_ LPWIN32_FIND_DATAW lpFindFileData
        );

    WINBASEAPI
        bool
        WINAPI
        AreFileApisANSI(
            VOID
        );


#ifndef FALSE
#define FALSE               0
#endif

#ifndef TRUE
#define TRUE                1
#endif

#ifndef IN
#define IN
#endif

#ifndef OUT
#define OUT
#endif

#ifndef OPTIONAL
#define OPTIONAL
#endif

#undef far
#undef near
#undef pascal

#define far
#define near


#define CP_ACP                    0           // default to ANSI code page
#define CP_OEMCP                  1           // default to OEM  code page
#define CP_MACCP                  2           // default to MAC  code page
#define CP_THREAD_ACP             3           // current thread's ANSI code page
#define CP_SYMBOL                 42          // SYMBOL translations

#define CP_UTF7                   65000       // UTF-7 translation
#define CP_UTF8                   65001       // UTF-8 translation

    typedef WCHAR* PWCHAR, * LPWCH, * PWCH;
    typedef const WCHAR* LPCWCH, * PCWCH;
    typedef _Null_terminated_ CHAR* NPSTR, * LPSTR, * PSTR;

    WINBASEAPI
        _Success_(return != 0)
        _When_((cchWideChar == -1) && (cbMultiByte != 0), _Post_equal_to_(_String_length_(lpMultiByteStr) + 1))
        int
        WINAPI
        WideCharToMultiByte(
            _In_ UINT CodePage,
            _In_ DWORD dwFlags,
            _In_NLS_string_(cchWideChar) LPCWCH lpWideCharStr,
            _In_ int cchWideChar,
            // _Out_writes_bytes_to_opt_(cbMultiByte, return) LPSTR lpMultiByteStr,
            _Out_writes_bytes_to_(cbMultiByte, return) LPSTR lpMultiByteStr,
            _In_ int cbMultiByte,
            _In_ LPCCH lpDefaultChar,
            _Out_ LPBOOL lpUsedDefaultChar/*
            _In_opt_ LPCCH lpDefaultChar,
            _Out_opt_ LPBOOL lpUsedDefaultChar */
        );

#define MB_PRECOMPOSED            0x00000001  // DEPRECATED: use single precomposed characters when possible.
#define MB_COMPOSITE              0x00000002  // DEPRECATED: use multiple discrete characters when possible.
#define MB_USEGLYPHCHARS          0x00000004  // DEPRECATED: use glyph chars, not ctrl chars
#define MB_ERR_INVALID_CHARS      0x00000008  // error for invalid chars

    typedef void* LPVOID;
    typedef const void* LPCVOID;

    typedef const CHAR* LPCCH, * PCCH;


    typedef BOOL near* PBOOL;
    typedef BOOL far* LPBOOL;

    WINBASEAPI
        _Success_(return != 0)
        _When_((cbMultiByte == -1) && (cchWideChar != 0), _Post_equal_to_(_String_length_(lpWideCharStr) + 1))
        int
        WINAPI
        MultiByteToWideChar(
            _In_ UINT CodePage,
            _In_ DWORD dwFlags,
            _In_NLS_string_(cbMultiByte) LPCCH lpMultiByteStr,
            _In_ int cbMultiByte,
            _Out_writes_to_opt_(cchWideChar, return) LPWSTR lpWideCharStr,
            _In_ int cchWideChar
        );

    WINBASEAPI
        HANDLE
        WINAPI
        FindFirstFileExW(
            _In_ LPCWSTR lpFileName,
            _In_ FINDEX_INFO_LEVELS fInfoLevelId,
            _Out_writes_bytes_(sizeof(WIN32_FIND_DATAW)) LPVOID lpFindFileData,
            _In_ FINDEX_SEARCH_OPS fSearchOp,
            _Reserved_ LPVOID lpSearchFilter,
            _In_ DWORD dwAdditionalFlags
        );

    /* For compatibility with Symbian */
#define wdirent _wdirent
#define WDIR _WDIR
#define wopendir _wopendir
#define wreaddir _wreaddir
#define wclosedir _wclosedir
#define wrewinddir _wrewinddir


/* Internal utility functions */
    static WIN32_FIND_DATAW* dirent_first(_WDIR* dirp);
    static WIN32_FIND_DATAW* dirent_next(_WDIR* dirp);

    static int dirent_mbstowcs_s(
        size_t* pReturnValue,
        wchar_t* wcstr,
        size_t sizeInWords,
        const char* mbstr,
        size_t count);

    static int dirent_wcstombs_s(
        size_t* pReturnValue,
        char* mbstr,
        size_t sizeInBytes,
        const wchar_t* wcstr,
        size_t count);

    static void dirent_set_errno(int error);


    /*
     * Open directory stream DIRNAME for read and return a pointer to the
     * internal working area that is used to retrieve individual directory
     * entries.
     */
    static _WDIR*
        _wopendir(
            const wchar_t* dirname)
    {
        _WDIR* dirp = NULL;
        DWORD n;
        wchar_t* p;

        /* Must have directory name */
        if (dirname == NULL || dirname[0] == '\0') {
            dirent_set_errno(ENOENT);
            return NULL;
        }

        /* Allocate new _WDIR structure */
        dirp = (_WDIR*)malloc(sizeof(struct _WDIR));
        if (!dirp) {
            return NULL;
        }

        /* Reset _WDIR structure */
        dirp->handle = INVALID_HANDLE_VALUE;
        dirp->patt = NULL;
        dirp->cached = 0;

        /*
         * Compute the length of full path plus zero terminator
         *
         * Note that on WinRT there's no way to convert relative paths
         * into absolute paths, so just assume it is an absolute path.
         */
#if defined(WINAPI_FAMILY) && defined(WINAPI_FAMILY_PHONE_APP) && (WINAPI_FAMILY == WINAPI_FAMILY_PHONE_APP)
         /* WinRT */
        n = wcslen(dirname);
#else
         /* Regular Windows */
        n = GetFullPathNameW(dirname, 0, NULL, NULL);
#endif

        /* Allocate room for absolute directory name and search pattern */
        dirp->patt = (wchar_t*)malloc(sizeof(wchar_t) * n + 16);
        if (dirp->patt == NULL) {
            goto exit_closedir;
        }

        /*
         * Convert relative directory name to an absolute one.  This
         * allows rewinddir() to function correctly even when current
         * working directory is changed between opendir() and rewinddir().
         *
         * Note that on WinRT there's no way to convert relative paths
         * into absolute paths, so just assume it is an absolute path.
         */
#if defined(WINAPI_FAMILY) && defined(WINAPI_FAMILY_PHONE_APP) && (WINAPI_FAMILY == WINAPI_FAMILY_PHONE_APP)
         /* WinRT */
        wcsncpy_s(dirp->patt, n + 1, dirname, n);
#else
         /* Regular Windows */
        n = GetFullPathNameW(dirname, n, dirp->patt, NULL);
        if (n <= 0) {
            goto exit_closedir;
        }
#endif

        /* Append search pattern \* to the directory name */
        p = dirp->patt + n;
        switch (p[-1]) {
        case '\\':
        case '/':
        case ':':
            /* Directory ends in path separator, e.g. c:\temp\ */
            /*NOP*/;
            break;

        default:
            /* Directory name doesn't end in path separator */
            *p++ = '\\';
        }
        *p++ = '*';
        *p = '\0';

        /* Open directory stream and retrieve the first entry */
        if (!dirent_first(dirp)) {
            goto exit_closedir;
        }

        /* Success */
        return dirp;

        /* Failure */
    exit_closedir:
        _wclosedir(dirp);
        return NULL;
    }

    /*
     * Read next directory entry.
     *
     * Returns pointer to static directory entry which may be overwritten by
     * subsequent calls to _wreaddir().
     */
    static struct _wdirent*
        _wreaddir(
            _WDIR* dirp)
    {
        struct _wdirent* entry;

        /*
         * Read directory entry to buffer.  We can safely ignore the return value
         * as entry will be set to NULL in case of error.
         */
        (void)_wreaddir_r(dirp, &dirp->ent, &entry);

        /* Return pointer to statically allocated directory entry */
        return entry;
    }

    /*
     * Read next directory entry.
     *
     * Returns zero on success.  If end of directory stream is reached, then sets
     * result to NULL and returns zero.
     */
    static int
        _wreaddir_r(
            _WDIR* dirp,
            struct _wdirent* entry,
            struct _wdirent** result)
    {
        WIN32_FIND_DATAW* datap;

        /* Read next directory entry */
        datap = dirent_next(dirp);
        if (datap) {
            size_t n;
            DWORD attr;

            /*
             * Copy file name as wide-character string.  If the file name is too
             * long to fit in to the destination buffer, then truncate file name
             * to PATH_MAX characters and zero-terminate the buffer.
             */
            n = 0;
            while (n < PATH_MAX && datap->cFileName[n] != 0) {
                entry->d_name[n] = datap->cFileName[n];
                n++;
            }
            entry->d_name[n] = 0;

            /* Length of file name excluding zero terminator */
            entry->d_namlen = n;

            /* File type */
            attr = datap->dwFileAttributes;
            if ((attr & FILE_ATTRIBUTE_DEVICE) != 0) {
                entry->d_type = DT_CHR;
            }
            else if ((attr & FILE_ATTRIBUTE_DIRECTORY) != 0) {
                entry->d_type = DT_DIR;
            }
            else {
                entry->d_type = DT_REG;
            }

            /* Reset dummy fields */
            entry->d_ino = 0;
            entry->d_off = 0;
            entry->d_reclen = sizeof(struct _wdirent);

            /* Set result address */
            *result = entry;

        }
        else {

            /* Return NULL to indicate end of directory */
            *result = NULL;

        }

        return /*OK*/0;
    }

    /*
     * Close directory stream opened by opendir() function.  This invalidates the
     * DIR structure as well as any directory entry read previously by
     * _wreaddir().
     */
    static int
        _wclosedir(
            _WDIR* dirp)
    {
        int ok;
        if (dirp) {

            /* Release search handle */
            if (dirp->handle != INVALID_HANDLE_VALUE) {
                FindClose(dirp->handle);
            }

            /* Release search pattern */
            free(dirp->patt);

            /* Release directory structure */
            free(dirp);
            ok = /*success*/0;

        }
        else {

            /* Invalid directory stream */
            dirent_set_errno(EBADF);
            ok = /*failure*/-1;

        }
        return ok;
    }

    /*
     * Rewind directory stream such that _wreaddir() returns the very first
     * file name again.
     */
    static void
        _wrewinddir(
            _WDIR* dirp)
    {
        if (dirp) {
            /* Release existing search handle */
            if (dirp->handle != INVALID_HANDLE_VALUE) {
                FindClose(dirp->handle);
            }

            /* Open new search handle */
            dirent_first(dirp);
        }
    }

    /* Get first directory entry (internal) */
    static WIN32_FIND_DATAW*
        dirent_first(
            _WDIR* dirp)
    {
        WIN32_FIND_DATAW* datap;
        DWORD error;

        /* Open directory and retrieve the first entry */
        dirp->handle = FindFirstFileExW(
            dirp->patt, FindExInfoStandard, &dirp->data,
            FindExSearchNameMatch, NULL, 0);
        if (dirp->handle != INVALID_HANDLE_VALUE) {

            /* a directory entry is now waiting in memory */
            datap = &dirp->data;
            dirp->cached = 1;

        }
        else {

            /* Failed to open directory: no directory entry in memory */
            dirp->cached = 0;
            datap = NULL;

            /* Set error code */
            error = GetLastError();
            switch (error) {
            case ERROR_ACCESS_DENIED:
                /* No read access to directory */
                dirent_set_errno(EACCES);
                break;

            case ERROR_DIRECTORY:
                /* Directory name is invalid */
                dirent_set_errno(ENOTDIR);
                break;

            case ERROR_PATH_NOT_FOUND:
            default:
                /* Cannot find the file */
                dirent_set_errno(ENOENT);
            }

        }
        return datap;
    }

    /*
     * Get next directory entry (internal).
     *
     * Returns
     */
    static WIN32_FIND_DATAW*
        dirent_next(
            _WDIR* dirp)
    {
        WIN32_FIND_DATAW* p;

        /* Get next directory entry */
        if (dirp->cached != 0) {

            /* A valid directory entry already in memory */
            p = &dirp->data;
            dirp->cached = 0;

        }
        else if (dirp->handle != INVALID_HANDLE_VALUE) {

            /* Get the next directory entry from stream */
            if (FindNextFileW(dirp->handle, &dirp->data) != FALSE) {
                /* Got a file */
                p = &dirp->data;
            }
            else {
                /* The very last entry has been processed or an error occurred */
                FindClose(dirp->handle);
                dirp->handle = INVALID_HANDLE_VALUE;
                p = NULL;
            }

        }
        else {

            /* End of directory stream reached */
            p = NULL;

        }

        return p;
    }

    /*
     * Open directory stream using plain old C-string.
     */
    static DIR*
        opendir(
            const char* dirname)
    {
        struct DIR* dirp;
        int error;
        wchar_t wname[PATH_MAX + 1];
        size_t n;

        /* Must have directory name */
        if (dirname == NULL || dirname[0] == '\0') {
            dirent_set_errno(ENOENT);
            return NULL;
        }

        /* Allocate memory for DIR structure */
        dirp = (DIR*)malloc(sizeof(struct DIR));
        if (!dirp) {
            return NULL;
        }

        /* Convert directory name to wide-character string */
        error = dirent_mbstowcs_s(
            &n, wname, PATH_MAX + 1, dirname, PATH_MAX + 1);
        if (error) {
            /*
             * Cannot convert file name to wide-character string.  This
             * occurs if the string contains invalid multi-byte sequences or
             * the output buffer is too small to contain the resulting
             * string.
             */
            goto exit_free;
        }


        /* Open directory stream using wide-character name */
        dirp->wdirp = _wopendir(wname);
        if (!dirp->wdirp) {
            goto exit_free;
        }

        /* Success */
        return dirp;

        /* Failure */
    exit_free:
        free(dirp);
        return NULL;
    }

    /*
     * Read next directory entry.
     */
    static struct dirent*
        readdir(
            DIR* dirp)
    {
        struct dirent* entry;

        /*
         * Read directory entry to buffer.  We can safely ignore the return value
         * as entry will be set to NULL in case of error.
         */
        (void)readdir_r(dirp, &dirp->ent, &entry);

        /* Return pointer to statically allocated directory entry */
        return entry;
    }

    /*
     * Read next directory entry into called-allocated buffer.
     *
     * Returns zero on success.  If the end of directory stream is reached, then
     * sets result to NULL and returns zero.
     */
    static int
        readdir_r(
            DIR* dirp,
            struct dirent* entry,
            struct dirent** result)
    {
        WIN32_FIND_DATAW* datap;

        /* Read next directory entry */
        datap = dirent_next(dirp->wdirp);
        if (datap) {
            size_t n;
            int error;

            /* Attempt to convert file name to multi-byte string */
            error = dirent_wcstombs_s(
                &n, entry->d_name, PATH_MAX + 1, datap->cFileName, PATH_MAX + 1);

            /*
             * If the file name cannot be represented by a multi-byte string,
             * then attempt to use old 8+3 file name.  This allows traditional
             * Unix-code to access some file names despite of unicode
             * characters, although file names may seem unfamiliar to the user.
             *
             * Be ware that the code below cannot come up with a short file
             * name unless the file system provides one.  At least
             * VirtualBox shared folders fail to do this.
             */
            if (error && datap->cAlternateFileName[0] != '\0') {
                error = dirent_wcstombs_s(
                    &n, entry->d_name, PATH_MAX + 1,
                    datap->cAlternateFileName, PATH_MAX + 1);
            }

            if (!error) {
                DWORD attr;

                /* Length of file name excluding zero terminator */
                entry->d_namlen = n - 1;

                /* File attributes */
                attr = datap->dwFileAttributes;
                if ((attr & FILE_ATTRIBUTE_DEVICE) != 0) {
                    entry->d_type = DT_CHR;
                }
                else if ((attr & FILE_ATTRIBUTE_DIRECTORY) != 0) {
                    entry->d_type = DT_DIR;
                }
                else {
                    entry->d_type = DT_REG;
                }

                /* Reset dummy fields */
                entry->d_ino = 0;
                entry->d_off = 0;
                entry->d_reclen = sizeof(struct dirent);

            }
            else {

                /*
                 * Cannot convert file name to multi-byte string so construct
                 * an erroneous directory entry and return that.  Note that
                 * we cannot return NULL as that would stop the processing
                 * of directory entries completely.
                 */
                entry->d_name[0] = '?';
                entry->d_name[1] = '\0';
                entry->d_namlen = 1;
                entry->d_type = DT_UNKNOWN;
                entry->d_ino = 0;
                entry->d_off = -1;
                entry->d_reclen = 0;

            }

            /* Return pointer to directory entry */
            *result = entry;

        }
        else {

            /* No more directory entries */
            *result = NULL;

        }

        return /*OK*/0;
    }

    /*
     * Close directory stream.
     */
    static int
        closedir(
            DIR* dirp)
    {
        int ok;
        if (dirp) {

            /* Close wide-character directory stream */
            ok = _wclosedir(dirp->wdirp);
            dirp->wdirp = NULL;

            /* Release multi-byte character version */
            free(dirp);

        }
        else {

            /* Invalid directory stream */
            dirent_set_errno(EBADF);
            ok = /*failure*/-1;

        }
        return ok;
    }

    /*
     * Rewind directory stream to beginning.
     */
    static void
        rewinddir(
            DIR* dirp)
    {
        /* Rewind wide-character string directory stream */
        _wrewinddir(dirp->wdirp);
    }

    /*
     * Scan directory for entries.
     */
    static int
        scandir(
            const char* dirname,
            struct dirent*** namelist,
            int (*filter)(const struct dirent*),
            int (*compare)(const struct dirent**, const struct dirent**))
    {
        struct dirent** files = NULL;
        size_t size = 0;
        size_t allocated = 0;
        const size_t init_size = 1;
        DIR* dir = NULL;
        struct dirent* entry;
        struct dirent* tmp = NULL;
        size_t i;
        int result = 0;

        /* Open directory stream */
        dir = opendir(dirname);
        if (dir) {

            /* Read directory entries to memory */
            while (1) {

                /* Enlarge pointer table to make room for another pointer */
                if (size >= allocated) {
                    void* p;
                    size_t num_entries;

                    /* Compute number of entries in the enlarged pointer table */
                    if (size < init_size) {
                        /* Allocate initial pointer table */
                        num_entries = init_size;
                    }
                    else {
                        /* Double the size */
                        num_entries = size * 2;
                    }

                    /* Allocate first pointer table or enlarge existing table */
                    p = realloc(files, sizeof(void*) * num_entries);
                    if (p != NULL) {
                        /* Got the memory */
                        files = (dirent**)p;
                        allocated = num_entries;
                    }
                    else {
                        /* Out of memory */
                        result = -1;
                        break;
                    }

                }

                /* Allocate room for temporary directory entry */
                if (tmp == NULL) {
                    tmp = (struct dirent*)malloc(sizeof(struct dirent));
                    if (tmp == NULL) {
                        /* Cannot allocate temporary directory entry */
                        result = -1;
                        break;
                    }
                }

                /* Read directory entry to temporary area */
                if (readdir_r(dir, tmp, &entry) == /*OK*/0) {

                    /* Did we get an entry? */
                    if (entry != NULL) {
                        int pass;

                        /* Determine whether to include the entry in result */
                        if (filter) {
                            /* Let the filter function decide */
                            pass = filter(tmp);
                        }
                        else {
                            /* No filter function, include everything */
                            pass = 1;
                        }

                        if (pass) {
                            /* Store the temporary entry to pointer table */
                            files[size++] = tmp;
                            tmp = NULL;

                            /* Keep up with the number of files */
                            result++;
                        }

                    }
                    else {

                        /*
                         * End of directory stream reached => sort entries and
                         * exit.
                         */
                        qsort(files, size, sizeof(void*),
                            (int (*) (const void*, const void*)) compare);
                        break;

                    }

                }
                else {
                    /* Error reading directory entry */
                    result = /*Error*/ -1;
                    break;
                }

            }

        }
        else {
            /* Cannot open directory */
            result = /*Error*/ -1;
        }

        /* Release temporary directory entry */
        free(tmp);

        /* Release allocated memory on error */
        if (result < 0) {
            for (i = 0; i < size; i++) {
                free(files[i]);
            }
            free(files);
            files = NULL;
        }

        /* Close directory stream */
        if (dir) {
            closedir(dir);
        }

        /* Pass pointer table to caller */
        if (namelist) {
            *namelist = files;
        }
        return result;
    }

    /* Alphabetical sorting */
    static int
        alphasort(
            const struct dirent** a, const struct dirent** b)
    {
        return strcoll((*a)->d_name, (*b)->d_name);
    }

    /* Sort versions */
    static int
        versionsort(
            const struct dirent** a, const struct dirent** b)
    {
        /* FIXME: implement strverscmp and use that */
        return alphasort(a, b);
    }

    /* Convert multi-byte string to wide character string */
    static int
        dirent_mbstowcs_s(
            size_t* pReturnValue,
            wchar_t* wcstr,
            size_t sizeInWords,
            const char* mbstr,
            size_t count)
    {
        int error;
        int n;
        size_t len;
        UINT cp;
        DWORD flags;

        /* Determine code page for multi-byte string */
#if WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
        if (AreFileApisANSI()) {
            /* Default ANSI code page */
            cp = GetACP();
        }
        else {
            /* Default OEM code page */
            cp = GetOEMCP();
        }
#else
        cp = CP_ACP;
#endif // WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)

        /*
         * Determine flags based on the character set.  For more information,
         * please see https://docs.microsoft.com/fi-fi/windows/desktop/api/stringapiset/nf-stringapiset-multibytetowidechar
         */
        switch (cp) {
        case 42:
        case 50220:
        case 50221:
        case 50222:
        case 50225:
        case 50227:
        case 50229:
        case 57002:
        case 57003:
        case 57004:
        case 57005:
        case 57006:
        case 57007:
        case 57008:
        case 57009:
        case 57010:
        case 57011:
        case 65000:
            /* MultiByteToWideChar does not support MB_ERR_INVALID_CHARS */
            flags = 0;
            break;

        default:
            /*
             * Ask MultiByteToWideChar to return an error if a multi-byte
             * character cannot be converted to a wide-character.
             */
            flags = MB_ERR_INVALID_CHARS;
        }

        /* Compute the length of input string without zero-terminator */
        len = 0;
        while (mbstr[len] != '\0' && len < count) {
            len++;
        }

        /* Convert to wide-character string */
        n = MultiByteToWideChar(
            /* Source code page */ cp,
            /* Flags */ flags,
            /* Pointer to string to convert */ mbstr,
            /* Size of multi-byte string */ (int)len,
            /* Pointer to output buffer */ wcstr,
            /* Size of output buffer */ (int)sizeInWords - 1
        );

        /* Ensure that output buffer is zero-terminated */
        wcstr[n] = '\0';

        /* Return length of wide-character string with zero-terminator */
        *pReturnValue = (size_t)(n + 1);

        /* Return zero if conversion succeeded */
        if (n > 0) {
            error = 0;
        }
        else {
            error = 1;
        }
        return error;
    }

    /* Convert wide-character string to multi-byte string */
    static int
        dirent_wcstombs_s(
            size_t* pReturnValue,
            char* mbstr,
            size_t sizeInBytes, /* max size of mbstr */
            const wchar_t* wcstr,
            size_t count)
    {
        int n;
        int error;
        UINT cp;
        size_t len;
        BOOL flag = 0;
        LPBOOL pflag;

        /* Determine code page for multi-byte string */
#if WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)
        if (AreFileApisANSI()) {
            /* Default ANSI code page */
            cp = GetACP();
        }
        else {
            /* Default OEM code page */
            cp = GetOEMCP();
        }
#else
        cp = CP_ACP;
#endif // WINAPI_FAMILY_PARTITION(WINAPI_PARTITION_DESKTOP)


        /* Compute the length of input string without zero-terminator */
        len = 0;
        while (wcstr[len] != '\0' && len < count) {
            len++;
        }

        /*
         * Determine if we can ask WideCharToMultiByte to return information on
         * broken characters.  For more information, please see
         * https://docs.microsoft.com/en-us/windows/desktop/api/stringapiset/nf-stringapiset-widechartomultibyte
         */
        switch (cp) {
        case CP_UTF7:
        case CP_UTF8:
            /*
             * WideCharToMultiByte fails if we request information on default
             * characters.  This is just a nuisance but doesn't affect the
             * conversion: if Windows is configured to use UTF-8, then the default
             * character should not be needed anyway.
             */
            pflag = NULL;
            break;

        default:
            /*
             * Request that WideCharToMultiByte sets the flag if it uses the
             * default character.
             */
            pflag = &flag;
        }

        /* Convert wide-character string to multi-byte character string */
        n = WideCharToMultiByte(
            /* Target code page */ cp,
            /* Flags */ 0,
            /* Pointer to unicode string */ wcstr,
            /* Length of unicode string */ (int)len,
            /* Pointer to output buffer */ mbstr,
            /* Size of output buffer */ (int)sizeInBytes - 1,
            /* Default character */ NULL,
            /* Whether default character was used or not */ pflag
        );

        /* Ensure that output buffer is zero-terminated */
        mbstr[n] = '\0';

        /* Return length of multi-byte string with zero-terminator */
        *pReturnValue = (size_t)(n + 1);

        /* Return zero if conversion succeeded without using default characters */
        if (n > 0 && flag == 0) {
            error = 0;
        }
        else {
            error = 1;
        }
        return error;
    }

    /* Set errno variable */
    static void
        dirent_set_errno(
            int error)
    {
#if defined(_MSC_VER)  &&  _MSC_VER >= 1400

        /* Microsoft Visual Studio 2005 and later */
        _set_errno(error);

#else

        /* Non-Microsoft compiler or older Microsoft compiler */
        errno = error;

#endif
    }


#ifdef __cplusplus
}
#endif
#endif /*DIRENT_H*/
