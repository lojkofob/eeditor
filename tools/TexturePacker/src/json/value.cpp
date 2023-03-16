#include <stdlib.h>
#include <cstring>
#include <locale.h>
#include <assert.h>
#include <limits.h>
#include <float.h>

#include "value.h"

#include <jsmn.h>
#include <utf8.h>

#ifdef BUILD_WINPH
// вставлено специально для strtoll для винфона.
#include <Core/Common.h>
#endif

/*---------------------------------------------------------------------------*/
/*  Implementation.                */
/*---------------------------------------------------------------------------*/
namespace Json
{
    std::string numberToString (double v)
    {
        // проверка на NaN
        if (!(v == v)) return "null";
        
        // проверка на inf
        if (!((v <= DBL_MAX) && (v >= -DBL_MAX))) return "null";
        
        ///
        /// Bug #84683 Создается невалидный json при больших значениях double
        /// размер буфера изменён с 255 до 1080
        /// https://stackoverflow.com/questions/1701055/what-is-the-maximum-length-in-chars-needed-to-represent-any-double-value
        ///
        char buffer[1080];
        size_t buffer_size = 1080;
        int printedChars = snprintf (buffer, buffer_size, "%f", v);
        /// если printedChars < 0 это признак ошибки
        /// если printedChars >= 1080 это значит, что число не влезло в буфер
        if (printedChars >= 0 && (size_t)printedChars < buffer_size)
            {
            char* pt = strrchr (buffer, '.');
            if(pt)
                {
                /// отрезаем лишнее с конца, включая десятичную точку, если за ней
                /// нет ничего значащего
                char* lc = buffer + printedChars;
                while ((--lc >= pt) && ((*lc == '0') || (*lc == '.')))
                    {
                    printedChars--;
                    }
                }
            return std::string (buffer, (size_t)printedChars);
            }
        return "Bad Number";
    }
    
    
    std::string numberToString (long long v)
    {
        static char buf[64];
        int l = snprintf (buf, 63,"%lld", v);
        return std::string (buf, (size_t)l);
    }
    
    void escape (char *dst, const char* src)
    {
        char c;
        while ((c = *src++))
        {
            switch (c)
            {
                case '\"' :
                    *dst++ = '\\';
                    *dst++ = '\"';
                    break;
                case '\\' :
                    *dst++ = '\\';
                    *dst++ = '\\';
                    break;
                case '/'  :
                    *dst++ = '\\';
                    *dst++ = '/';
                    break;
                case '\b' :
                    *dst++ = '\\';
                    *dst++ = 'b';
                    break;
                case '\f' :
                    *dst++ = '\\';
                    *dst++ = 'f';
                    break;
                case '\n' :
                    *dst++ = '\\';
                    *dst++ = 'n';
                    break;
                case '\r' :
                    *dst++ = '\\';
                    *dst++ = 'r';
                    break;
                case '\t' :
                    *dst++ = '\\';
                    *dst++ = 't';
                    break;
                default:
                    *dst++ = c;
                    break;
            }
        }
        *dst = 0;
    }
    
    void
    ssplit (std::vector<std::string>& theStringVector,  /* Altered/returned value */
            const  std::string  & theString,
            const  std::string  & theDelimiter,
            bool  theIncludeEmptyStrings)
    {
        size_t start = 0, end = 0, length = 0;
        
        while ( end != std::string::npos )
        {
            end = theString.find ( theDelimiter, start );
            
            // If at end, use length=maxLength.  Else use length=end-start.
            length = (end == std::string::npos) ? std::string::npos : end - start;
            
            if (    theIncludeEmptyStrings
                || (   ( length > 0 ) /* At end, end == length == string::npos */
                    && ( start  < theString.size() ) ) )
                theStringVector.push_back( theString.substr( start, length ) );
            
            // If at end, use start=maxSize.  Else use start=end+delimiter.
            start = (   ( end > (std::string::npos - theDelimiter.size()) )
                     ?  std::string::npos  :  end + theDelimiter.size()     );
        }
    }
    
    std::vector<std::string>
    ssplit ( const std::string  & theString,
            const std::string  & theDelimiter,
            bool             theIncludeEmptyStrings = false )
    {
        std::vector<std::string> v;
        ssplit ( v, theString, theDelimiter, theIncludeEmptyStrings );
        return v;
    }
    
    std::string escapedString (const std::string& s)
    {
        std::string es;
        
        const char* src = s.c_str ();
        size_t sz = strlen (src) * 2;
        
        char* dst = (char*) malloc (sz+1);
        if (dst) {
            memset (dst, 0, sz+1);
            escape (dst, src);
            es = dst;
            free (dst);
        }
        return es;
    }
    
    //////////////////////////////////////////////////////////////////////////////
    //
    //
    //  ObjectContainer class implementation
    //
    //
    //////////////////////////////////////////////////////////////////////////////
#ifdef USE_SHARED_VOCABULARY
    
    bool Comparator::operator()(const char* a, const char* b) const
    {
        return strcmp(a, b) < 0;
    }
    
    std::map<const char*, size_t, Comparator> ObjectContainer::_proxyContainer;
    std::vector<const char*> ObjectContainer::_reverseContainer;
    size_t ObjectContainer::_s2n(const std::string& k)
    {
        auto it = _proxyContainer.find(k.c_str());
        if (it != _proxyContainer.end()) return it->second;
        
        char* string = (char*)malloc(k.length() + 1);
        strcpy(string, k.c_str());
        size_t number = _reverseContainer.size();
        _reverseContainer.push_back(string);
        _proxyContainer[string] = number;
        return number;
    }
    
    const std::string ObjectContainer::_n2s(size_t k)
    {
        return _reverseContainer[k];
    }
    
    void ObjectContainer::_print_dictionary()
    {
        for (auto pci :_proxyContainer) {
            std::cout << "\"" << pci.first << "\"" << std::endl;
        }
    }
    
    
    ObjectContainer::iterator ObjectContainer::begin()
    {
        return ObjectContainer::iterator(_container, _container.begin());
    }
    
    ObjectContainer::iterator ObjectContainer::end()
    {
        return ObjectContainer::iterator(_container, _container.end());
    }
    
    ObjectContainer::iterator ObjectContainer::find(const std::string& k)
    {
        return ObjectContainer::iterator(_container, _container.find(_s2n(k)));
    }
    
    size_t ObjectContainer::size()
    {
        return _container.size();
    }
    
    void ObjectContainer::clear()
    {
        _container.clear();
    }
    
    Value& ObjectContainer::operator[](const std::string& k)
    {
        return _container[_s2n(k)];
    }
    
    size_t ObjectContainer::erase(const std::string& k)
    {
        return _container.erase(_s2n(k));
    }
    
    std::pair<ObjectContainer::iterator,bool> ObjectContainer::insert(const std::pair<std::string, Value>& d)
    {
        auto res = _container.insert(std::pair<size_t, Value>(_s2n(d.first), d.second));
        return std::pair<ObjectContainer::iterator, bool>(ObjectContainer::iterator(_container, res.first), res.second);
    }
    
#endif // PROXY_CONTAINER
    
    //////////////////////////////////////////////////////////////////////////////
    //
    //
    //  Value class implementation
    //
    //
    //////////////////////////////////////////////////////////////////////////////
    const Value Value::_emptyValue;
    const std::string Value::_emptyString;
    
    Value::_Value setZeroValue()
    {
        Value::_Value v;
        memset(&v, 0, sizeof(Value::_Value));
        return v;
    }
    
    Value::_Value Value::_zeroValue = setZeroValue();
    
    
    Value::Value(ValueTypes) : _type(UNDEFINED), _value(_zeroValue)
    {
    }
    
    Value::Value(bool v) : _type(BOOLEAN), _value(_zeroValue)
    {
        _value._l = v;
    }
    
    Value::Value(int v) : _type(INTEGER), _value(_zeroValue)
    {
        _value._i = v;
    }
    
    Value::Value(unsigned int v) : _type(INTEGER), _value(_zeroValue)
    {
        _value._i = v;
    }
    
    Value::Value(long v) : _type(INTEGER), _value(_zeroValue)
    {
        _value._i = v;
    }
    
    Value::Value(long long v) : _type(INTEGER), _value(_zeroValue)
    {
        _value._i = v;
    }
    
    Value::Value(size_t v) : _type(INTEGER), _value(_zeroValue)
    {
        _value._i = (long long)v;
    }
    
    Value::Value(double v) : _type(NUMBER), _value(_zeroValue)
    {
        _value._d = v;
    }
    
    Value::Value(const char* v) : _type(STRING), _value(_zeroValue)
    {
        _value._s = new std::string (v);
    }
    
    Value::Value(const std::string& v) : _type(STRING), _value(_zeroValue)
    {
        _value._s = new std::string (v);
    }
    
    Value::Value(std::string&& v) : _type(STRING), _value(_zeroValue)
    {
        _value._s = new std::string ();
        std::swap (*(std::string*)_value._s, v);
    }
    
    /* ХИТРЫЙ КОНСТРУКТОР для объектов, прочитанных из потока */
    Value::Value(char *buffer, size_t size, bool itIsString)
    : _type(UNDEFINED), _value(_zeroValue)
    {
        double d = 0;
        long long l = 0;
        char *p = 0;
        char lc = *(buffer + size);
        *(buffer + size) = 0;
        
        if (itIsString) goto parse_string;
        
        if (l = strtoll(buffer, &p, 10), (*p == 0)) /* ЦЕЛОЕ ЧИСЛО ... */
        {
            _type     = INTEGER;
            _value._i = l;
        }
        else if (d = strtod(buffer, &p), (*p == 0)) /* ЧИСЛО С ПЛАВАЮЩЕЙ ... */
        {
            _type     = NUMBER;
            _value._d = d;
        }
        else if (strcmp(buffer, "true") == 0)
        {
            _type     = BOOLEAN;
            _value._l = true;
        }
        else if (strcmp(buffer, "false") == 0)
        {
            _type     = BOOLEAN;
            _value._l = false;
        }
        else if (strcmp(buffer, "null") == 0)
        {
        }
        else
        {
        parse_string:
            _type = STRING;
            _value._s = new std::string(buffer, size);
            std::string& ps = *(_value._s);
            size_t r = (size_t)u8_unescape(&ps[0], (int)size, ps.c_str());
            ps.resize(r);
        }
        *(buffer + size) = lc;
    }
    
    Value Value::createArray()
    {
        Value v;
        v._type = ARRAY;
        v._value._a = new ArrayContainer;
        return v;
    }
    
    Value Value::createObject()
    {
        Value v;
        v._type = OBJECT;
        v._value._o = new ObjectContainer ();
        return v;
    }
    
    void Value::reset ()
    {
        switch (_type)
        {
            case OBJECT:
                delete _value._o;
                break;
                
            case ARRAY:
                delete _value._a;
                break;
                
            case STRING:
                delete _value._s;
                break;
                
            case RAW:
                delete _value._r;
                break;
                
            default:
                break;
        }
        
        _type = UNDEFINED;
        _value = _zeroValue;
        
    }
    
    Value::~Value ()
    {
        reset ();
    }
    
    Value::Value(const Value& v) : _type(v._type), _value(_zeroValue)
    {
        switch (_type)
        {
            case OBJECT:
                _value._o = new ObjectContainer (*v._value._o);
                break;
                
            case ARRAY:
                _value._a = new ArrayContainer (*v._value._a);
                break;
                
            case STRING:
                _value._s = new std::string (*v._value._s);
                break;
                
            case RAW:
                _value._r = new RawData (*v._value._r);
                break;
                
            default:
                _value = v._value;
                break;
        }
        
    }
    
    Value::Value (Value&& v) : _type(v._type), _value(v._value)
    {
        v._type = UNDEFINED;
    }
    
    Value& Value::operator= (const Value& v)
    {
        if (&v == this) return *this;
        
        ValueTypes savedType = v._type;
        _Value savedValue(_zeroValue);
        
        switch (savedType)
        {
            case OBJECT:
                savedValue._o = new ObjectContainer (*v._value._o);
                break;
                
            case ARRAY:
                savedValue._a = new ArrayContainer (*v._value._a);
                break;
                
            case STRING:
                savedValue._s = new std::string (*v._value._s);
                break;
                
            case RAW:
                savedValue._r = new RawData (*v._value._r);
                
                break;
                
            default:
                savedValue = v._value;
                break;
        }
        
        reset ();
        
        _type = savedType;
        _value = savedValue;
        
        return *this;
    }
    
    
    Value& Value::operator= (Value&& v)
    {
        if (&v == this) return *this;
        
        reset ();
        
        _type = v._type;
        _value = v._value;
        
        v._type = UNDEFINED;
        
        return *this;
    }
    
    bool Value::asBoolean (bool defaultValue) const
    {
        switch (_type)
        {
            case BOOLEAN: return _value._l;
            case STRING: return !_value._s->empty();
            case INTEGER: return _value._i != 0;
            case NUMBER: return _value._d != 0;
            case UNDEFINED:
            case OBJECT:
            case ARRAY:
            case RAW:
            default:
                return defaultValue;
        }
    }
    
    double Value::asNumber (double defaultValue) const
    {
        char *p = 0;
        switch (_type)
        {
            case BOOLEAN: return _value._l ? 1 : 0;
            case INTEGER: return (double)_value._i;
            case NUMBER: return _value._d;
            case STRING: return strtod (_value._s->c_str(), &p);
            case RAW:
            default:
                return defaultValue;
        }
    }
    
    long Value::asLong (long defaultValue) const
    {
        return (long)asLongLong(defaultValue);
    }
    
    long long Value::asLongLong (long long defaultValue) const
    {
        char *p = 0;
        switch (_type)
        {
            case BOOLEAN: return _value._l ? 1 : 0;
            case INTEGER: return _value._i;
            case NUMBER: return (long long)_value._d;
            case STRING: return strtoll (_value._s->c_str(), &p, 10);
                
            case RAW:
            default:
                return defaultValue;
        }
    }
    
    int Value::asInt (int defaultValue) const
    {
        return (int)asLongLong(defaultValue);
    }
    
    std::string Value::asString (std::string defaultValue) const
    {
        switch (_type)
        {
            case ARRAY: return "Array[]";
            case OBJECT: return "Object{}";
            case BOOLEAN: return _value._l ? "true" : "false";
            case INTEGER: return numberToString (_value._i);
            case NUMBER: return numberToString (_value._d);
            case STRING: return *_value._s;
            case UNDEFINED:
            case RAW:
            default:
                return defaultValue;
        }
    }
    
    const std::string& Value::asConstString (const std::string& defaultValue) const {
        if (_type == STRING) return *_value._s;
        return defaultValue;
    }
    
    std::string Value::asEscapedString (std::string defaultValue) const
    {
        return escapedString (this->asString (defaultValue));
    }
    
    bool Value::hasKey (const std::string &str) const
    {
        if (_type != OBJECT) return false;
        return _value._o->find(str) != _value._o->end();
    }
    
    Value& Value::operator[] (size_t key)
    {
        if (_type != ARRAY)
        {
            reset ();
            _type = ARRAY;
            _value._a = new ArrayContainer;
        }
        
        if (key < _value._a->size())
        {
            return (*_value._a)[key];
        }
        else
        {
            _value._a->resize (key+1);
            return _value._a->back ();
        }
    }
    
    Value& Value::add (const Value& v) {
        size_t oldSize = size();
        (*this)[oldSize] = v;
        return (*this)[oldSize];
    }
    
    Value& Value::operator[] (const std::string& key)
    {
        if (_type != OBJECT)
        {
            reset ();
            _type = OBJECT;
            _value._o = new ObjectContainer;
        }
        
        return _value._o->operator[](key);
    }
    
    const Value& Value::operator[] (const std::string& key) const
    {
        switch (_type)
        {
            case OBJECT:
            {
                ObjectContainer::iterator i = _value._o->find (key);
                if (i != _value._o->end ()) return i->second;
            }
                break;
                
            default:
                break;
        }
        return _emptyValue;
    }
    
    const Value& Value::operator[] (size_t key) const
    {
        switch (_type)
        {
            case ARRAY:
            {
                if (key < _value._a->size()) return (*_value._a)[key];
            }
                break;
                
            default:
                break;
        }
        return _emptyValue;
    }
    
    size_t Value::size () const
    {
        switch (_type)
        {
            case ARRAY: return _value._a->size();
            case OBJECT: return _value._o->size();
            case RAW: return _value._r->size();
            default: return 0;
        }
    }
    
    void Value::reserve(size_t size)
    {
        switch (_type)
        {
            case ARRAY: _value._a->reserve(size); break;
            case OBJECT: _value._o->reserve(size); break;
            case RAW: _value._r->reserve(size); break;
            default: break;
        }
    }
    
    void Value::clear ()
    {
        switch (_type)
        {
            case ARRAY:
                _value._a->clear ();
                break;
                
            case OBJECT:
                _value._o->clear ();
                break;
                
            default:
                break;
        }
    }
    
    void Value::erase (const Value& key)
    {
        switch (_type)
        {
            case ARRAY:
            {
                int N = key.asInt();
                if (N >= 0 && (size_t)N < _value._a->size())
                    _value._a->erase (_value._a->begin() + (ptrdiff_t)N);
            }
                break;
                
            case OBJECT:
                _value._o->erase (key.asString ());
                break;
                
            default:
                break;
        }
    }
    
    std::vector<std::string> Value::indexes () const {
        std::vector<std::string> ret;
        
        if (_type == OBJECT) {
            ret.resize(_value._o->size());
            std::vector<std::string>::iterator p = ret.begin ();
            for (auto i = _value._o->begin(); i != _value._o->end(); ++i) {
                *p = (*i).first;
                ++p;
            }
        }
        
        return ret;
    }
    
    //
    // New powerful operator+
    //
    Value Value::operator+ (const Value& v) const
    {
        switch (_type)
        {
            case UNDEFINED: return v;
            case BOOLEAN: return _value._l && v.asBoolean();
            case INTEGER: return _value._i + v.asLongLong();
            case NUMBER: return _value._d + v.asNumber();
            case STRING: return *_value._s + v.asString();
            case RAW: return *this;
            case ARRAY:
            {
                Value rv(*this);
                switch (v._type)
                {
                    case ARRAY:
                        rv._value._a->insert(
                                             rv._value._a->end(),
                                             v._value._a->begin(),
                                             v._value._a->end());
                        break;
                        
                    default:
                        rv._value._a->insert(rv._value._a->end(), v);
                        break;
                }
                return rv;
            }
                
            case OBJECT:
            {
                Value rv(*this);
                switch (v._type)
                {
                    case OBJECT:
                        for (const auto& j : *v.asObject())
                        {
                            rv[j.first] = rv[j.first] + j.second;
                        }
                        break;
                        
                    default:
                        rv[v.asString()] = rv[v.asString()] + v;
                        break;
                }
                return rv;
            }
        }
        return Value();
    }
    
    Value Value::operator| (const Value& v) const
    {
        switch (_type)
        {
            case UNDEFINED:
                return v;
                
            case BOOLEAN:
            case INTEGER:
            case NUMBER:
            case STRING:
            case RAW:
                return *this;
                
            case ARRAY:
            {
                Value rv(*this);
                switch (v._type)
                {
                    case ARRAY:
                        rv._value._a->insert(
                                             rv._value._a->end(),
                                             v._value._a->begin(),
                                             v._value._a->end());
                        break;
                        
                    default:
                        rv._value._a->insert(rv._value._a->end(), v);
                        break;
                }
                return rv;
            }
                
            case OBJECT:
            {
                Value rv(*this);
                switch (v._type)
                {
                    case OBJECT:
                        for (const auto& j : *v.asObject())
                        {
                            rv[j.first] = rv[j.first] | j.second;
                        }
                        break;
                        
                    default:
                        rv[v.asString()] = rv[v.asString()] | v;
                        break;
                }
                return rv;
            }
        }
        return Value();
    }
    
    
    
    /*
     11.9.3 The Abstract Equality Comparison Algorithm
     http://www.ecma-international.org/ecma-262/5.1/#sec-11.9.3
     */
    bool Value::operator==(const Value& v) const
    {
        if (_type == v._type)
        {
            switch (_type)
            {
                case UNDEFINED: return true;
                case BOOLEAN: return _value._l == v._value._l;
                case INTEGER: return _value._i == v._value._i;
                case NUMBER: return _value._d == v._value._d;
                case STRING: return *_value._s == *v._value._s;
                case RAW: return false;
                case ARRAY:
                case OBJECT:
                    return stringifyThis() == v.stringifyThis();
            }
        }
        else
        {
            switch (v._type)
            {
                case BOOLEAN: return asBoolean() == v._value._l;
                case INTEGER: return asLongLong() == v._value._i;
                case NUMBER: return asNumber() == v._value._d;
                case STRING: return asString() == *v._value._s;
                case UNDEFINED:
                case ARRAY:
                case OBJECT:
                case RAW:
                    return false;
            }
        }
        return false;
    }
    
    std::vector<std::string> Value::split(const char* dlm) const
    {
        if (_type != STRING) return std::vector<std::string>();
        return ssplit (*_value._s, dlm);
    }
    
    std::string Value::stringifyThis() const
    {
        return stringify(*this, true);
    }
    
    std::string Value::prettyStringifyThis() const
    {
        return prettyStringify(*this);
    }
    
    ObjectContainer* Value::asObject () const
    {
        switch (_type)
        {
            case OBJECT: return _value._o;
            default: return 0;
        }
    }
    
    ArrayContainer* Value::asArray () const
    {
        switch (_type)
        {
            case ARRAY: return _value._a;
            default: return 0;
        }
    }
    
    /* операторы приведения типа */
    void Value::assign( int & val) const { val = asInt(); }
    void Value::assign( float & val) const { val = (float)asNumber(); }
    void Value::assign( double & val) const { val = asNumber(); }
    void Value::assign( std::string & val) const { val = asString(); }
    void Value::assign( bool & val) const { val = asBoolean(); }
    void Value::assign( long long& val) const { val = asLongLong(); }
    
    void Value::assign(Value& v)
    {
        if (&v != this) {
            v.reset();
            v._type = _type;
            v._value = _value;
            _type = UNDEFINED;
        }
    }
    
    void Value::mergeFrom(const Json::Value &src, bool withReplace){
        if (src._type != _type && withReplace) {
            // just replace self value
            reset();
            switch (src._type)
            {
                case OBJECT:
                    _value._o = new ObjectContainer (*src._value._o);
                    break;
                    
                case ARRAY:
                    _value._a = new ArrayContainer (*src._value._a);
                    break;
                    
                case STRING:
                    _value._s = new std::string (*src._value._s);
                    break;
                    
                case RAW:
                    _value._r = new RawData (*src._value._r);
                    break;
                    
                default:
                    _value = src._value;
                    break;
            }
            _type = src._type;
        }
        else {
            switch (_type) {
                case Json::OBJECT: {
                    // add keys or replace if exist
                    for (auto it = src._value._o->begin(); it != src._value._o->end(); ++it) {
                        auto it2 = _value._o->find(it->first);
                        if (it2 == _value._o->end())
                            _value._o->insert(*it);
                        else
                            it2->second.mergeFrom(it->second, withReplace);
                    }
                    break;
                }
                    
                case Json::ARRAY: {
                    // append to array
                    if (withReplace) {
                        _value._a->insert( _value._a->end(), src._value._a->begin(), src._value._a->end() );
                    }
                    break;
                }
                    
                default: break;
            }
        }
    }
    
    void Value::mergeTo(Json::Value &dst) const {
        dst.mergeFrom(*this);
    }
    
    std::ostream& operator<<(std::ostream& os, const Value& value)
    {
        os << value.stringifyThis();
        return os;
    }
    
    //////////////////////////////////////////////////////////////////////////////
    //
    //
    //  END OF Value class implementation
    //
    //
    //////////////////////////////////////////////////////////////////////////////
    Value jsmn_dump_token (jsmntok_t **pobj, char* js)
    {
        jsmntok_t* obj = *pobj;
        
        switch (obj->type)
        {
            case JSMN_PRIMITIVE:
            case JSMN_STRING:
            {
                return Value(js + obj->start, (size_t)(obj->end - obj->start), (obj->type==JSMN_STRING));
            }
                
            case JSMN_ARRAY:
            {
                Value arr = Value::createArray();
                ArrayContainer& ac = *(arr.asArray());
                ac.reserve((size_t)obj->size);
                for (int i=0, osz=obj->size; i<osz; ++i)
                {
                    ac.push_back(jsmn_dump_token (&(++(*pobj)), js));
                }
                return arr;
            }
                
            case JSMN_OBJECT:
            {
                Value obj2 = Value::createObject();
                for (int i=0, osz=obj->size; i < osz; ++i)
                {
                    Value idx = jsmn_dump_token(&(++(*pobj)), js);
                    obj2[idx.asString()] = jsmn_dump_token (&(++(*pobj)), js);
                }
                return obj2;
            }
                
            default:
                return Value ();
        }
    }
    
    Value parse_string(const char* string)
    {
        std::string s(string);
        return parse_buffer(&s[0], s.size());
    }
    
    Value parse_buffer(char* bufferHead, size_t bufferSize)
    {
        Value res;
        
        int r;
        unsigned int num_tokens = 1024;
        jsmntok_t* tokens = 0;
        jsmn_parser parser;
        jsmn_init (&parser);
        
    LOOP_JSMN_ERROR_NOMEM:
        
        tokens=(jsmntok_t*)realloc(tokens, num_tokens * sizeof(jsmntok_t));
        if (tokens == 0)
        {
            exit(EXIT_FAILURE);
        }
        
        r = jsmn_parse (&parser, bufferHead, bufferSize, tokens, num_tokens);
        
        if ( r > 0 )
        {
            jsmntok_t *T = tokens;
            res = jsmn_dump_token (&T, (char*)bufferHead);
            
        }
        else if (r == JSMN_ERROR_NOMEM )
        {
            num_tokens+=num_tokens;
            goto LOOP_JSMN_ERROR_NOMEM;
            
        }
        else if (r == JSMN_ERROR_INVAL )
        {
        }
        else if (r == JSMN_ERROR_PART )
        {
        }
        
        free(tokens);
        
        return res;
        
    }
    
    Value parse_file (const char* fileName) {
        Value res;
        char* js = 0;
        size_t filesize = 0;
        
        FILE* f = fopen (fileName, "r");
        if (f == 0) {
            return res;
        }
        
        fseek(f,0,SEEK_END);
        filesize=(size_t)ftell(f);
        fseek(f,0,SEEK_SET);
        js=(char*)malloc(filesize);
        if (js) {
            filesize = fread(js, 1, filesize, f);
            fclose(f);
            res = parse_buffer (js, filesize);
            free(js);
        }
        return res;
    }
    
    std::string prettyStringify (const Value& v, const char* indent, std::string indent00, std::string indent11, const char* eol, bool sorted)
    {
        std::string res;
        
        switch (v.type())
        {
            case UNDEFINED :
            case RAW:
                return std::string ("null");
                
            case INTEGER :
            case NUMBER :
            case BOOLEAN :
                return v.asString ();
                
            case STRING :
                return std::string ("\"") + v.asEscapedString () + "\"";
                
            case ARRAY :
            {
                res += "[";
                res += eol;
                
                int i = 0;
                const ArrayContainer& ac = *v.asArray();
                for (auto a = ac.begin(), e = ac.end(); a != e; ++a)
                {
                    const Json::Value& val = *a;
                    if (val.type() == RAW) continue;
                    
                    if (i)
                    {
                        res += ",";
                        res += eol;
                    }
                    
                    res += indent11;
                    res += prettyStringify (val, indent, indent11, indent11 + indent, eol);
                    
                    ++i;
                }
                res += eol;
                res += indent00 + "]";
                return res;
            }
                
            case OBJECT :
            {
                res += "{";
                res += eol;
                
                if (sorted)
                {
                    int i = 0;
                    std::vector<std::string> keys = v.indexes();
                    std::sort(keys.begin(), keys.end());
                    for (auto key : keys)
                    {
                        const Json::Value& val = v[key];
                        if (val.type() == RAW) continue;
                        if (i)
                        {
                            res += ",";
                            res += eol;
                        }
                        
                        res += indent11;
                        res += "\"" + escapedString (key) + "\": " + prettyStringify (val, indent, indent11, indent11+indent, eol);
                        
                        ++i;
                    }
                    res += eol;
                }
                else
                {
                    int i = 0;
                    ObjectContainer& oc = *v.asObject();
                    for (auto p = oc.begin(), e = oc.end(); p != e; ++p)
                    {
                        const Json::Value& val = p->second;
                        if (val.type() == RAW) continue;   
                        if (i)
                        {
                            res += ",";
                            res += eol;
                        }
                        
                        res += indent11;
                        res += "\"" + escapedString (p->first) + "\": " + prettyStringify (val, indent, indent11, indent11 + indent, eol);
                        
                        ++i;
                    }
                    res += eol;
                }
                res += indent00 + "}";
                return res;
            }
                
            default:
                break;
        }
        return res;
    }
    
    std::string stringify (const Value& v, bool sorted)
    {
        return prettyStringify (v, "", "", "", "", sorted);
    }
    
    
    
}  // namespace Json
