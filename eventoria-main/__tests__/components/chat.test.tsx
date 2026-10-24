import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatInterface } from "@/components/planner/ChatInterface";

describe("ChatInterface component", () => {
  it("renders welcome message and input field", () => {
    render(<ChatInterface />);

    expect(screen.getByText(/Eventoria Planning Assistant/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about budgets/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/i })).toBeInTheDocument();
  });

  it("displays active event context when provided", () => {
    render(
      <ChatInterface
        eventContext={{
          eventType: "wedding",
          guestCount: 200,
          city: "Udaipur",
        }}
      />
    );

    expect(screen.getByText(/Active Context:/i)).toBeInTheDocument();
    expect(screen.getByText(/Wedding in Udaipur/i)).toBeInTheDocument();
  });

  it("handles input typing and switches between streaming and quick-ask modes", () => {
    render(<ChatInterface />);

    const quickAskBtn = screen.getByRole("button", { name: /Quick Ask/i });
    fireEvent.click(quickAskBtn);

    const input = screen.getByPlaceholderText(/Ask a quick planning question/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Average DJ cost?" } });
    expect(input).toHaveValue("Average DJ cost?");
  });

  it("populates input from starter prompt chips", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"text": "You can cut decor costs by using seasonal flowers."}\n\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode("data: [DONE]\n\n"),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });
    global.fetch = fetchMock;

    render(<ChatInterface />);
    const chip = screen.getByText(/How can we cut 10% from our decor budget?/i);
    fireEvent.click(chip);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
