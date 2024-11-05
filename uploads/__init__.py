#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2023/4/24 22:26
# @Author  : alexanderwu
# @File    : __init__.py

from metagpt import _compat as _  # noqa: F401

import atexit
import os
from pathlib import Path  # 引入 Path 以便路径操作
# from metagpt.const import METAGPT_ROOT  

def cleanup():
    # log_file_dir = Path("logs")
    log_file_dir = Path(__file__).parent.parent / "logs"
    fliter_dir = log_file_dir / "fliter.py"
    result_dir = log_file_dir / "result.py"
    # fliter_dir = METAGPT_ROOT / "logs" / "fliter.py"
    # result_dir = METAGPT_ROOT / "logs" / "result.py"
    try:
        # 使用命令行运行 fliter.py
        if os.system(f'python {fliter_dir}') == 0:
            print("fliter.py 执行成功")
        else:
            print("执行 fliter.py 失败")
    except Exception as e:
        print(f"执行 fliter.py 时出错: {e}")

    try:
        # 使用命令行运行 result.py
        if os.system(f'python {result_dir}') == 0:
            print("result.py 执行成功")
            print("日志已重构")
        else:
            print("执行 result.py 失败")
    except Exception as e:
        print(f"执行 result.py 时出错: {e}")


# 注册退出函数
atexit.register(cleanup)
