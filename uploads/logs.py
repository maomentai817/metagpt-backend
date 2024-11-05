#!/usr/bin/env python  
# -*- coding: utf-8 -*-  
"""  
@Time    : 2023/6/1 12:41  
@Author  : alexanderwu  
@File    : logs.py  
"""  
  
import sys  
from datetime import datetime  
from pathlib import Path  

from loguru import logger as _logger  
  
# 假设 METAGPT_ROOT 是一个 Path 对象，指向你的项目根目录  
from metagpt.const import METAGPT_ROOT  
  
_print_level = "INFO"  


def define_log_level(print_level="INFO", logfile_level="DEBUG", name: str =None):  
    """Adjust the log level to above level and set up logging to stderr and a file in JSON format."""  
    global _print_level  
    _print_level = print_level  
  
    current_date = datetime.now()  
    formatted_date = current_date.strftime("%Y%m%d")  
    log_name = f"{name}_{formatted_date}" if name else formatted_date  
    log_file_path = METAGPT_ROOT / "logs" / f"{log_name}.log"  # 使用 .log 扩展名，但内容是 JSON  
  
    # Ensure the logs directory exists  
    log_dir = log_file_path.parent  
    if not log_dir.exists():  
        log_dir.mkdir(parents=True)  
  
    _logger.remove()  # Remove the default logger configuration  
    _logger.add(sys.stderr, level=print_level, format="{message}")  # Log to stderr with a simple format  
    _logger.add(  
        log_file_path,  
        level=logfile_level,  
        serialize=True,  # Serialize logs to JSON 
        retention="10 days",  # Optionally set a retention policy  
    )  
    return _logger  
  
  
logger = define_log_level()  
  
  
def log_llm_stream(msg):  
    _llm_stream_log(msg)  
  
  
def set_llm_stream_logfunc(func):  
    global _llm_stream_log  
    _llm_stream_log = func  
  
  
def _llm_stream_log(msg):  
    if _print_level == "INFO":  # Use == instead of in ["INFO"] for simplicity in this case  
        print(msg, end="")  
  
# Example usage  
if __name__ == "__main__":  
    logger.info("This is an info message.")  
    logger.debug("This is a debug message that will only appear in the logfile if the level is set to DEBUG or lower.")