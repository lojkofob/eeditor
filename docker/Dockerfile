FROM ubuntu:26.04
ENV OSVER=26.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN apt-get update
RUN apt-get install -y --no-install-recommends python3
RUN apt-get install -y --no-install-recommends curl
RUN apt-get install -y --no-install-recommends net-tools
RUN apt-get install -y --no-install-recommends iputils-ping
RUN apt-get install -y --no-install-recommends ssh
RUN apt-get install -y --no-install-recommends rsync
RUN apt-get install -y --no-install-recommends make
RUN apt-get install -y --no-install-recommends wget
RUN apt-get install -y --no-install-recommends cmake
RUN apt-get install -y --no-install-recommends clang
RUN apt-get install -y --no-install-recommends build-essential
RUN apt-get install -y --no-install-recommends libcurl4-openssl-dev
RUN apt-get install -y --no-install-recommends libzip-dev
RUN apt-get install -y --no-install-recommends libpng-dev
RUN apt-get install -y --no-install-recommends xorg-dev
RUN apt-get install -y --no-install-recommends gnupg
RUN apt-get install -y --no-install-recommends libssl-dev
RUN apt-get install -y --no-install-recommends imagemagick
RUN apt-get install -y --no-install-recommends iproute2

RUN apt-get install -y --no-install-recommends apache2
RUN apt-get install -y --no-install-recommends php8.5
RUN apt-get install -y --no-install-recommends libapache2-mod-php
# RUN apt-get install -y --no-install-recommends php-mysql
# RUN apt-get install -y --no-install-recommends php-curl
# RUN apt-get install -y --no-install-recommends mysql-server 
# RUN apt-get install -y --no-install-recommends php-mbstring
# RUN apt-get install -y --no-install-recommends phpmyadmin
RUN apt-get install -y --no-install-recommends mc

RUN apt-get install -y --no-install-recommends nodejs
RUN apt-get install -y --no-install-recommends dos2unix 
RUN apt-get install -y --no-install-recommends zip 
RUN apt-get install -y --no-install-recommends ffmpeg

RUN update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++ 60 && wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.0/libssl1.0.0_1.0.2n-1ubuntu5_amd64.deb && dpkg -i libssl1.0.0_1.0.2n-1ubuntu5_amd64.deb

# RUN apt-get install -y ssmtp
# RUN apt-get install -y libfreetype6-dev
# RUN apt-get install -y libjpeg62-turbo-dev
# RUN apt-get install -y libmcrypt-dev
# RUN apt-get install -y zlib1g-dev
# RUN apt-get install -y libpq-dev
# RUN apt-get install -y libmemcached-dev
# RUN apt-get install -y --no-install-recommends memcached php-memcache mcrypt

RUN apt-get update
RUN apt-get install -y --no-install-recommends default-jre

# RUN phpenmod iconv pdo pdo_mysql memcache
RUN a2enmod rewrite

# RUN docker-php-ext-install mcrypt
# RUN docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
# RUN docker-php-ext-install -j$(nproc) gd

# RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3 get-pip.py
# RUN python3 -m pip install ansible

RUN apt-get install -y --no-install-recommends python3-fonttools

# configuration

# php
# RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
RUN sed -i 's/short_open_tag = Off/short_open_tag = On/g' /etc/php/8.5/apache2/php.ini
RUN sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 200M/g' /etc/php/8.5/apache2/php.ini
RUN sed -i 's/post_max_size = 8M/post_max_size = 200M/g' /etc/php/8.5/apache2/php.ini

# mysql
# RUN service mysql start && sleep 10 && \
#    mysql -e "ALTER USER 'mysql_user_name'@'localhost' IDENTIFIED WITH mysql_native_password by 'mysql_user_password';" && \
#    mysql -uroot -proot -e "SET GLOBAL sql_mode = '';"

# phpmyadmin
# RUN ln -s /etc/phpmyadmin/apache.conf /etc/apache2/conf-available/phpmyadmin.conf
# RUN a2enconf phpmyadmin.conf
# RUN echo "\$dbuser='mysql_user_name';\$dbpass='mysql_user_password';\$dbserver='127.0.0.1';" >> /etc/phpmyadmin/config-db.php

RUN a2enmod headers

# to build:
# docker-compose up --build

# to run:
# docker run -v F:/dev/www/:/var/www/html -p 80:80 --rm -it eeditor-server bash 
# service memcached start; service apache2 start; service mysql start 
