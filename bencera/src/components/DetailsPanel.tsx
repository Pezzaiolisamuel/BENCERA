"use client";

export default function DetailsPanel({ item, onClose }: any) {
  return (
    <div
      style={{
        width: item ? "50vw" : "0",
        height: "100%",
        transition: "width 0.3s ease",
        background: "#dfdfdf",
        overflow: "hidden",
        position: "relative",
        borderLeft: item ? "1px solid black" : "none",
        zIndex: 10,
        padding: item ? "70px 30px" : "0",
        boxSizing: "border-box",
      }}
    >
      {item && (
        <>
          <div
            style={{
              position: "absolute",
              top: 80,
              right: 20,
              cursor: "pointer",
              fontSize: "2rem",
            }}
            onClick={onClose}
          >
            ×
          </div>

          <h2>{item.name}</h2>
          <p>{item.shortDescription}</p>

          <div
            style={{
              width: "100%",
              height: "70vh",
              border: "1px solid black",
              marginTop: 20,
            }}
          />
        </>
      )}
    </div>
  );
}
