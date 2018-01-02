FROM python:3.6-jessie
LABEL maintainer="j.innerbichler@gmail.com"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN pip install requests==2.18.4
COPY client.py .
HEALTHCHECK --interval=10s --timeout=3s CMD curl -f http://user_one/ || exit 1
ENTRYPOINT ["python", "client.py"]