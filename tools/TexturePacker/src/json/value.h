#ifndef VALUE_H
#define VALUE_H

#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <algorithm>
#include <iostream>
#include <cstddef>

// Json::Value типа OBJECT представляет собой map со строковым ключом
// ключи могут повторятся и одинаковые строки хранятся в памяти по нескольку раз
//
// Макрос USE_SHARED_VOCABULARY включает "центролизованное ключехранилище"
// Если макрос определён, то строки хранятся в памяти в единственном экземпляре
// но не выгружаются из неё
//
// тесты показали экономию памяти и даже некоторое ускорение работы
//
// Если ваш проект не собирается, то замените в текстах своих циклов:
// - ObjectContainer::const_iterator на auto
// - постфиксный инкремент (it++) итератора на префиксный (++it)
//

// see Bug #74944
// #define USE_SHARED_VOCABULARY

/*---------------------------------------------------------------------------*/
/*  Types.                                                                   */
/*---------------------------------------------------------------------------*/

namespace Json
{
    std::string escapedString (const std::string& s);
    void ssplit (std::vector<std::string>& theStringVector, const std::string& theString, const std::string& theDelimiter, bool theIncludeEmptyStrings = false);
    
    class Value;
    
#ifndef USE_SHARED_VOCABULARY
    typedef std::unordered_map<std::string, Value> ObjectContainer;
#else
    struct Comparator {
        bool operator()(const char* a, const char* b) const;
    };
    class ObjectContainer
    {
        ////////////////////////////////////////////////////////////////
        static std::map<const char*, size_t, Comparator> _proxyContainer;
        static std::vector<const char*> _reverseContainer;
        static size_t _s2n(const std::string& k);
        static const std::string _n2s(size_t k);
    public:
        static void _print_dictionary();
        ////////////////////////////////////////////////////////////////
    private:
        typedef std::pair<std::string, Value&> DataType;
        typedef std::map<size_t, Value> ContainerType;
        ContainerType _container;
    public:
        template<typename D, class C, class I>
        class Iterator : public std::iterator<std::bidirectional_iterator_tag, DataType>
        {
            C& _container;
            I _iterator;
            D* _data;
        public:
            Iterator(C& c, I i) : _container(c), _iterator(i), _data(0) {
            }
            Iterator(const Iterator<D,C,I>& it)
            : _container(it._container), _iterator(it._iterator), _data(0) {
            }
            Iterator& operator=(const Iterator<D,C,I>& it) {
                if(_data) delete _data;
                _data = 0;
                _iterator = it._iterator;
                return *this;
            }
            ~Iterator() {
                if(_data) delete _data;
            }
            bool operator==(const Iterator<D,C,I>& it) {
                return _iterator == it._iterator;
            }
            bool operator!=(const Iterator<D,C,I>& it) {
                return _iterator != it._iterator;
            }
            DataType* operator->() {
                if(_data) delete _data;
                _data = new D(ObjectContainer::_n2s(_iterator->first), _iterator->second);
                return _data;
            }
            DataType& operator*() {
                if(_data) delete _data;
                _data = new D(ObjectContainer::_n2s(_iterator->first), _iterator->second);
                return *_data;
            }
            Iterator& operator++() {
                ++_iterator;
                return *this;
            }
            Iterator& operator--() {
                --_iterator;
                return *this;
            }
            Iterator operator++(int) {
                Iterator it(*this);
                ++_iterator;
                return it;
            }
            Iterator operator--(int) {
                Iterator it(*this);
                --_iterator;
                return it;
            }
            Iterator& operator+=(ptrdiff_t n) {
                _iterator += n;
                return *this;
            }
            Iterator& operator-=(ptrdiff_t n) {
                _iterator -= n;
                return *this;
            }
            Iterator operator+(ptrdiff_t n) {
                return Iterator(_container, _iterator + n);
            }
            Iterator operator-(ptrdiff_t n) {
                return Iterator(_container, _iterator - n);
            }
            ptrdiff_t operator-(const Iterator& it) {
                return _iterator - it->_iterator;
            }
            
        };
        typedef Iterator<DataType, ContainerType, ContainerType::iterator> iterator;
        typedef Iterator<DataType, ContainerType, ContainerType::const_iterator> const_iterator;
        
        iterator begin();
        iterator end();
        iterator find(const std::string& k);
        size_t size();
        void clear();
        Value& operator[](const std::string& k);
        size_t erase(const std::string& k);
        size_t insert(const std::string& k);
        std::pair<iterator,bool> insert(const std::pair<std::string, Value>& d);
    };
#endif /* USE_SHARED_VOCABULARY */
    
    typedef std::vector<Value> ArrayContainer;
    typedef std::vector<unsigned char> RawData;
    
    enum ValueTypes {UNDEFINED, BOOLEAN, NUMBER, INTEGER, STRING, ARRAY, OBJECT, RAW};
    
    
    class Value
    {
        // сделано для визуализации в Visual Studio средствами *.natvis
        // JsonValue.natvis нужно положить в  C:\Users\ПОЛЬЗОВАТЕЛЬ\Documents\Visual Studio 2013\Visualizers
        //< ? xml version = "1.0" encoding = "utf-8" ? >
        //	<AutoVisualizer xmlns = "http://schemas.microsoft.com/vstudio/debugger/natvis/2010">
        //	<Type Name = "Json::Value">
        //	<DisplayString Condition = "_type==0">{"UNDEFINED"} {"null"}< / DisplayString>
        //	<DisplayString Condition = "_type==1">{"BOOLEAN"} {_value._l}< / DisplayString>
        //	<DisplayString Condition = "_type==2">{"NUMBER"} {_value._d}< / DisplayString>
        //	<DisplayString Condition = "_type==3">{"INTEGER"} {_value._i}< / DisplayString>
        //	<DisplayString Condition = "_type==4">{"STRING"} {*((Json::Value::_String*)_value._p)}< / DisplayString>
        //	<DisplayString Condition = "_type==5">{"ARRAY"}< / DisplayString>
        //	<DisplayString Condition = "_type==6">{"OBJECT"}< / DisplayString>
        //	<Expand>
        //	<ExpandedItem Condition = "_type==5">*((Json::Value::_Array*)_value._p)< / ExpandedItem>
        //	<ExpandedItem Condition = "_type==6">*((Json::Value::_Object*)_value._p)< / ExpandedItem>
        //	< / Expand>
        //	< / Type>
        //	< / AutoVisualizer>
        typedef std::unordered_map<std::string, Value> _Object;
        typedef std::vector<Value> _Array;
        typedef std::basic_string<char> _String;
        
    public:
        Value (ValueTypes v = UNDEFINED); // фиктивный параметр нужен для emplace, а emplace нужен для скорости
        ~Value ();
        
        Value (const Value& v);
        Value (Value&& v);
        Value& operator=(const Value& v);
        Value& operator=(Value&& v);
        
        Value (bool v);
        Value (int v);
        Value (unsigned int v);
        Value (size_t v);
        Value (long v);
        Value (long long v);
        Value (double v);
        Value (const char* v);
        Value (char* buffer, size_t size, bool itIsString = false);
        Value (const std::string& v);
        Value (std::string&& v);
        
        template<class T>
        Value(const std::vector<T>& v)
        : _type(ARRAY), _value(_zeroValue)
        {
            _value._a = new ArrayContainer(v.begin(), v.end());
        }
        
#ifdef USE_SHARED_VOCABULARY
        template<class T>
        Value(const std::unordered_map<std::string, T>& v)
        : _type(OBJECT), _value(_zeroValue)
        {
            _value._o = new ObjectContainer;
            for(auto& p : v) _value._o->insert(p);
        }
#else
        template<class T>
        Value(const std::unordered_map<std::string, T>& v)
        : _type(OBJECT), _value(_zeroValue)
        {
            _value._o = new ObjectContainer(v.begin(), v.end());
        }
#endif
        
        static Value createArray();
        static Value createObject();
        
        ValueTypes type () const {return _type;}
        bool isUndefined () const {return _type == UNDEFINED;}
        bool isBoolean () const {return _type == BOOLEAN;}
        bool isNumber () const {return _type == NUMBER || _type == INTEGER;}
        bool isInteger () const {return _type == INTEGER;}
        bool isFloatingPoint () const {return _type == NUMBER;}
        bool isString () const {return _type == STRING;}
        bool isArray () const {return _type == ARRAY;}
        bool isObject () const {return _type == OBJECT;}
        bool isDict() const {return isObject();}
        bool isRaw() const {return _type == RAW;}
        
        bool asBoolean (bool defaultValue = false) const;
        double asNumber (double defaultValue = 0) const;
        long asLong (long defaultValue = 0) const;
        long long asLongLong (long long defaultValue = 0) const;
        int asInt (int defaultValue = 0) const;
        
        std::string asString (std::string defaultValue = "") const;
        const std::string& asConstString (const std::string& defaultValue = _emptyString) const;
        
        std::string asEscapedString (std::string defaultValue = "") const;
        bool hasKey (const std::string &str) const;
        
        Value& operator[](const std::string& key);
        Value& operator[](size_t key);
        Value& add(const Value& v);
        
        const Value& operator[] (const std::string& key) const;
        const Value& operator[] (size_t key) const;
        
        size_t size () const;
        
        /* резервирует память в контейнере */
        void reserve(size_t size);
        
        /* удаляет элемент с ключом key */
        void erase (const Value& key);
        // TODO: может стоит разделить на
		// void erase (const String& key);
		// void erase (int key);
		
        /* удаляет все элементы контейнера */
        void clear ();
        
        /* возвращает список ключей объекта в виде Value */
        std::vector<std::string> indexes () const;
        
        /* два могучих оператора для комбинирования значений Value */
        Value operator+(const Value& id) const;
        Value operator|(const Value& id) const;
        
        /*  */
        std::vector<std::string> split (const char* dlm) const;
        
        bool operator==(const Value& id) const;
        
        std::string stringifyThis() const;
        std::string	prettyStringifyThis() const;
        
        ObjectContainer* asObject () const;
        ArrayContainer* asArray () const;
        
        void mergeFrom(const Json::Value &src, bool withReplace = true);
        void mergeTo(Json::Value &dst) const;
        
        void assign (int&) const;
        void assign (float&) const;
        void assign (double&) const;
        void assign (long long&) const;
        void assign (std::string&) const;
        void assign (bool&) const;
        void assign (Json::Value&);
        
        void reset ();
        
    private:
        
        ValueTypes _type;
        
        union _Value {
            ObjectContainer* _o;
            ArrayContainer* _a;
            std::string* _s;
            RawData* _r;
            
            bool _l;
            long long _i;
            double _d;
        };
        static _Value _zeroValue;
        friend Value::_Value setZeroValue();
        
        _Value _value;
        static const Value _emptyValue;
        static const std::string _emptyString;
    public:
        
        template<typename T>
        T getValue () const {
            if (_type != RAW) return T(0);
            if (_value._r->size() != sizeof(T)) return T();
            return T(*(T*)&(*_value._r)[0]);
        }
        
        template<typename T>
        void setValue (const T& v) {
            reset();
            _type = RAW;
            char* p = (char*)&v;
            _value._r = new RawData (p, p + sizeof(T));
        }
        
        // более удобные методы для указателей.
        // указатели void* вызываются без темплейта
        // dynamic_cast позволяет обезопасить себя от неправильного raw-содержимого в _value._r
        // хотя, имхо, стоило бы ввести новый тип данных Json::POINTER и ложить его в _value._i (это быстрее)
        // однако тогда надо дописать везде в switch-case соответствующие пункты, а это уже может встретиться не только в движке
        // TODO: указатель на функцию так не поставить
        template<typename T>
        void setPointer (T* v) { setValue<T*>(v); }
        void setPointer (void* v) { setValue<void*>(v); }
        
        template<typename T>
        T* getPointer () const { return dynamic_cast<T*>( getValue<T*>() ); }
        void* getPointer () const { return getValue<void*>(); }
        
        static const Value& empty() { return _emptyValue; }
        static const std::string& emptyString() { return _emptyString; }
    };
    
    std::ostream& operator<<(std::ostream& os, const Value& value);
    
    Value parse_string (const char* string);
    Value parse_buffer (char* buffer, size_t size);
    Value parse_file (const char* fileName);
    
    std::string stringify (const Value& v, bool sorted = false);
    
    std::string
    prettyStringify (
                     const Value& v,
                     const char* indent = "    ",
                     std::string indent0 = "",
                     std::string indent1 = "    ",
                     const char* eol = "\n",
                     bool sorted = false
                     );
    
    std::string numberToString (double v);
    std::string numberToString (long long v);
    
}  // namespace Json

#endif  // VALUE_H
