FROM public.ecr.aws/lambda/python:3.12
COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi mangum
COPY src ${LAMBDA_TASK_ROOT}/src
COPY data ${LAMBDA_TASK_ROOT}/data
ENV PYTHONPATH=${LAMBDA_TASK_ROOT}/src
CMD ["signalledger.app.lambda_handler"]
