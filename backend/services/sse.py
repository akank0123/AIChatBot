"""SSE keep-alive wrapper — yields ': ping' comments when the LLM is slow."""
import asyncio
import json
from typing import AsyncGenerator


async def sse_with_keepalive(generator, interval: float = 15.0) -> AsyncGenerator[str, None]:
    queue: asyncio.Queue = asyncio.Queue()

    async def producer() -> None:
        try:
            async for item in generator:
                await queue.put(item)
        except Exception as e:
            await queue.put(f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n")
        finally:
            await queue.put(None)

    task = asyncio.create_task(producer())
    try:
        while True:
            try:
                item = await asyncio.wait_for(queue.get(), timeout=interval)
                if item is None:
                    break
                yield item
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    finally:
        await task
